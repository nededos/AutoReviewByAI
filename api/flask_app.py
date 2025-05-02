import os
from pathlib import Path
from datetime import datetime

from flask import Flask, jsonify, request, abort, Response
from flask_sqlalchemy import SQLAlchemy
from celery import Celery
from flask_cors import CORS
import requests
import openai
import json

from dotenv import load_dotenv
load_dotenv()

celery = Celery(__name__)

###############################################################################
# Configuration helpers
###############################################################################

def make_celery(app: Flask) -> Celery:
    """Create & configure Celery with the Flask app context."""
    celery = Celery(
        app.import_name,
        broker=app.config["CELERY_BROKER_URL"],
        backend=app.config["CELERY_RESULT_BACKEND"],
    )
    celery.conf.update(app.config)

    # Ensure tasks have application context
    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask  # type: ignore
    return celery

###############################################################################
# Application factory
###############################################################################

def create_app() -> Flask:
    """Flask application factory."""
    app = Flask(__name__)

    app.config.update(
        SQLALCHEMY_DATABASE_URI=os.getenv("DATABASE_URL", "sqlite:///db.sqlite3"),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        CELERY_BROKER_URL=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
        CELERY_RESULT_BACKEND=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0"),
        TMDB_API_KEY=os.getenv("TMDB_API_KEY"),
        OPENAI_API_KEY=os.getenv("OPENAI_API_KEY"),
    )

    if not app.config["TMDB_API_KEY"]:
        raise RuntimeError("TMDB_API_KEY is not set")
    if not app.config["OPENAI_API_KEY"]:
        raise RuntimeError("OPENAI_API_KEY is not set")

    openai.api_key = app.config["OPENAI_API_KEY"]

    CORS(app)
    db.init_app(app)
    global celery
    celery = make_celery(app)

    ###########################################################################
    # Routes
    ###########################################################################

    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    @app.route("/api/movies/<int:tmdb_id>", methods=["GET"])
    def get_movie(tmdb_id: int):
        movie = Movie.query.filter_by(tmdb_id=tmdb_id).first()
        if not movie:
            movie_data = fetch_tmdb_info(tmdb_id)
            if movie_data is None:
                abort(404, "Movie not found on TMDb")
            movie = Movie.from_tmdb(movie_data)
            db.session.add(movie)
            db.session.commit()

        if not movie.reviews:
            generate_review.delay(movie.id)
        return jsonify(movie.to_dict(include_reviews=True))

    @app.route("/api/movies/<int:tmdb_id>/review", methods=["POST"])
    def force_review(tmdb_id: int):
        movie = Movie.query.filter_by(tmdb_id=tmdb_id).first()
        if not movie:
            abort(404)
        generate_review.delay(movie.id)
        return {"queued": True}

    @app.route("/api/test-combined/<int:tmdb_id>", methods=["GET"])
    def test_combined(tmdb_id):
        movie_data = fetch_tmdb_info(tmdb_id)
        if not movie_data:
            return jsonify({"error": "Movie not found on TMDb"}), 404

        title = movie_data.get("title", "Unknown Title")
        release_date = movie_data.get("release_date")
        poster_path = movie_data.get("poster_path")
        genres = [g["name"] for g in movie_data.get("genres", [])]

        prompt = f"""
    Napisz recenzję filmu pod tytułem "{title}" w maksymalnie 200 słowach. Uwzględnij krótki opis 
fabuły, ocenę filmu (np. 8/10), analizę gry aktorskiej i reżyserii. Styl recenzji powinien być 
profesjonalny, ale przystępny, z lekkim humorem. Recenzja nie powinna zdradzać kluczowych 
zwrotów akcji. Jeśli film nie istnieje napisz, że taki nie istnieje.
"""
        try:
            gpt_response = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}]
            )
            review = gpt_response.choices[0].message.content.strip()
        except Exception as e:
            return jsonify({"movie": title, "review_error": str(e)}), 500

        response_data = {
            "movie": {
                "title": title,
                "release_date": release_date,
                "poster_path": poster_path,
                "genres": genres,
            },
            "review": review
        }

        return Response(
            json.dumps(response_data, ensure_ascii=False),
            content_type="application/json"
        )

    return app

###############################################################################
# Database models
###############################################################################

db = SQLAlchemy()

class Movie(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tmdb_id = db.Column(db.Integer, unique=True, nullable=False)
    title = db.Column(db.String, nullable=False)
    poster_path = db.Column(db.String)
    release_date = db.Column(db.Date)
    overview = db.Column(db.Text)

    reviews = db.relationship("Review", backref="movie", lazy=True, cascade="all, delete-orphan")

    @classmethod
    def from_tmdb(cls, payload: dict) -> "Movie":
        return cls(
            tmdb_id=payload["id"],
            title=payload.get("title"),
            poster_path=payload.get("poster_path"),
            release_date=datetime.strptime(payload.get("release_date", "1970-01-01"), "%Y-%m-%d").date(),
            overview=payload.get("overview"),
        )

    def to_dict(self, include_reviews: bool = False):
        data = {
            "id": self.id,
            "tmdb_id": self.tmdb_id,
            "title": self.title,
            "poster_path": self.poster_path,
            "release_date": self.release_date.isoformat() if self.release_date else None,
            "overview": self.overview,
        }
        if include_reviews:
            data["reviews"] = [r.to_dict() for r in self.reviews]
        return data

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.Integer, db.ForeignKey("movie.id"), nullable=False)
    author = db.Column(db.String, default="gpt")
    rating = db.Column(db.Float)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "author": self.author,
            "rating": self.rating,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
        }

###############################################################################
# TMDb helper
###############################################################################

def fetch_tmdb_info(tmdb_id: int) -> dict | None:
    key = os.getenv("TMDB_API_KEY")
    url = f"https://api.themoviedb.org/3/movie/{tmdb_id}?api_key={key}&language=en-US"
    print(f"📡 Requesting TMDb: {url}")
    response = requests.get(url, timeout=5)
    print("🌐 TMDb response:", response.status_code, response.text)
    if response.status_code != 200:
        return None
    return response.json()

###############################################################################
# Celery task
###############################################################################

@celery.task(name="generate_review")
def generate_review(movie_db_id: int):
    movie = Movie.query.get(movie_db_id)
    if not movie:
        return

    prompt = (
        f"You are a professional film critic. Write a concise (200-300 words) review "
        f"for the film '{movie.title}' (release year {movie.release_date.year}). "
        "Mention direction, acting, and overall impact."
    )

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
        )
        review_text = response.choices[0].message.content.strip()
    except Exception as exc:
        print("❌ GPT ERROR:", exc)
        return

    review = Review(movie_id=movie.id, rating=None, content=review_text)
    db.session.add(review)
    db.session.commit()
    return review.id

###############################################################################
# Entry‑point (dev only)
###############################################################################

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        Path("./migrations").mkdir(exist_ok=True)
        db.create_all()
    app.run(debug=True, port=8000)
