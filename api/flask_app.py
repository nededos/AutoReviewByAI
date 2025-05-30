import os
import random
from pathlib import Path
from datetime import datetime

from flask import Flask, jsonify, request, abort, Response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from celery import Celery
import requests
import openai
import json

from dotenv import load_dotenv
from models import db, Movie, Review

load_dotenv()

celery = Celery(__name__)


###############################################################################
# Configuration helpers
###############################################################################


def make_celery(app: Flask) -> Celery:
    celery = Celery(
        app.import_name,
        broker=app.config["CELERY_BROKER_URL"],
        backend=app.config["CELERY_RESULT_BACKEND"],
    )
    celery.conf.update(app.config)

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery


###############################################################################
# Application factory
###############################################################################


def create_app() -> Flask:
    app = Flask(__name__)

    app.config.update(
        SQLALCHEMY_DATABASE_URI=os.getenv("DATABASE_URL", "sqlite:///db.sqlite3"),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        CELERY_BROKER_URL=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
        CELERY_RESULT_BACKEND=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0"),
        TMDB_API_KEY=os.getenv("TMDB_API_KEY"),
        OPENAI_API_KEY=os.getenv("OPENAI_API_KEY"),
    )

    if not app.config["TMDB_API_KEY"] or not app.config["OPENAI_API_KEY"]:
        raise RuntimeError("API keys not set")

    openai.api_key = app.config["OPENAI_API_KEY"]

    CORS(app)
    db.init_app(app)
    global celery
    celery = make_celery(app)

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
    def test_combined_route(tmdb_id):
        return test_combined(tmdb_id)

    @app.route("/api/test-combined/random", methods=["GET"])
    def test_combined_random():
        max_id = 200000
        for _ in range(10):
            tmdb_id = random.randint(1, max_id)
            movie_data = fetch_tmdb_info(tmdb_id)
            if movie_data:
                return test_combined(tmdb_id)
        return jsonify({"error": "Nie udało się znaleźć filmu"}), 404

    return app


###############################################################################
# TMDb helper
###############################################################################


def fetch_tmdb_info(tmdb_id: int) -> dict | None:
    key = os.getenv("TMDB_API_KEY")
    base = f"https://api.themoviedb.org/3/movie/{tmdb_id}"
    lang = "pl-PL"

    movie_url = f"{base}?api_key={key}&language={lang}"
    credits_url = f"{base}/credits?api_key={key}&language={lang}"

    movie_response = requests.get(movie_url, timeout=5)
    credits_response = requests.get(credits_url, timeout=5)

    if movie_response.status_code != 200 or credits_response.status_code != 200:
        return None

    movie_data = movie_response.json()
    credits_data = credits_response.json()

    directors = [c["name"] for c in credits_data.get("crew", []) if c["job"] == "Director"]
    writers = [c["name"] for c in credits_data.get("crew", []) if c["department"] == "Writing"]
    actors = [a["name"] for a in credits_data.get("cast", [])][:5]

    movie_data["directors"] = directors
    movie_data["writers"] = writers
    movie_data["actors"] = actors

    return movie_data


###############################################################################
# Combined route logic
###############################################################################


def test_combined(tmdb_id: int):
    movie_data = fetch_tmdb_info(tmdb_id)
    if not movie_data:
        return jsonify({"error": "Movie not found on TMDb"}), 404

    title = movie_data.get("title", "Nieznany Tytuł")
    release_date = movie_data.get("release_date")
    poster_path = movie_data.get("poster_path")
    genres = [g["name"] for g in movie_data.get("genres", [])]
    directors = movie_data.get("directors", [])
    writers = movie_data.get("writers", [])
    actors = movie_data.get("actors", [])
    rating = movie_data.get("vote_average")

    prompt = f'''
    Napisz recenzję filmu pod tytułem "{title}" w języku polskim, w maksymalnie 200 słowach.
    Recenzja powinna:
    - zawierać krótki opis fabuły (bez spoilerów),
    - ocenić grę aktorską i reżyserię,
    - zawierać subiektywną ocenę filmu (od 0 do 10),
    - być napisana w stylu profesjonalnym, ale przystępnym i lekko ironicznym,
    - brzmieć naturalnie, jakby napisał ją człowiek, a nie sztuczna inteligencja.
    Unikaj zdradzania kluczowych zwrotów akcji.
    '''

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
            "directors": directors,
            "writers": writers,
            "actors": actors,
            "rating": rating
        },
        "review": review
    }

    return Response(
        json.dumps(response_data, ensure_ascii=False),
        content_type="application/json"
    )


###############################################################################
# Celery task
###############################################################################


@celery.task(name="generate_review")
def generate_review(movie_db_id: int):
    from flask_app import create_app
    app = create_app()
    with app.app_context():
        movie = Movie.query.get(movie_db_id)
        if not movie:
            return

        prompt = f'''
    Napisz recenzję filmu pod tytułem "{movie.title}" w języku polskim, w maksymalnie 200 słowach.
    Recenzja powinna:
    - zawierać krótki opis fabuły (bez spoilerów),
    - ocenić grę aktorską i reżyserię,
    - zawierać subiektywną ocenę filmu (od 0 do 10),
    - być napisana w stylu profesjonalnym, ale przystępnym i lekko ironicznym,
    - brzmieć naturalnie, jakby napisał ją człowiek, a nie sztuczna inteligencja.
    Unikaj zdradzania kluczowych zwrotów akcji.
    '''

        try:
            response = openai.chat.completions.create(
                model="gpt-4o-mini",
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
