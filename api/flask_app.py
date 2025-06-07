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
from models import db, Comment, User, Movie, Review
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

from dotenv import load_dotenv

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
        JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key"),
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

    CORS(app, resources={r"/*": {"origins": "*"}})
    db.init_app(app)
    global celerys
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
    
    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        user = User.query.filter_by(username=email).first()
        if user and user.password == password:
            token = create_access_token(identity=str(user.id))
            return jsonify(access_token=token), 200
        return jsonify(message='Invalid credentials'), 401

    @app.route("/api/movies/<int:tmdb_id>/comments", methods=["GET"])
    @jwt_required()
    def get_comments(tmdb_id):
        user_id = get_jwt_identity()
        comments = Comment.query.filter_by(tmdb_id=tmdb_id).all()
        return jsonify([
            {
                "content": c.content,
                "username": User.query.get(c.user_id).username if c.user_id else "Anonim"
            }
            for c in comments
        ])

    @app.route("/api/movies/<int:tmdb_id>/comment", methods=["POST"])
    @jwt_required()
    def add_comment(tmdb_id):
        data = request.get_json()
        comment_text = data.get("comment")
        if not comment_text:
            return jsonify({"message": "Komentarz nie może być pusty."}), 400
        user_id = get_jwt_identity()
        comment = Comment(tmdb_id=tmdb_id, content=comment_text, user_id=user_id, movie_id=tmdb_id)
        db.session.add(comment)
        db.session.commit()
        return jsonify({"message": "Komentarz zapisany!"}), 201

    @app.route('/api/register', methods=['POST'])
    def register():
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        if not email or not password:
            return jsonify(message='Email and password are required'), 400
        if User.query.filter_by(username=email).first():
            return jsonify(message='User already exists'), 400
        new_user = User(username=email, password=password)
        db.session.add(new_user)
        db.session.commit()
        return jsonify(message='User registered successfully'), 201
    
    @app.route("/api/movies", methods=["GET"])
    def popular_movies():
        key = os.getenv("TMDB_API_KEY")
        lang = "pl-PL"
        url = f"https://api.themoviedb.org/3/movie/popular?api_key={key}&language={lang}&page=1"
        response = requests.get(url, timeout=5)
        if response.status_code != 200:
            return jsonify({"error": "Błąd pobierania filmów"}), 500
        data = response.json()
        # Dodaj nazwy gatunków do każdego filmu
        genres_url = f"https://api.themoviedb.org/3/genre/movie/list?api_key={key}&language={lang}"
        genres_resp = requests.get(genres_url, timeout=5)
        genres_map = {}
        if genres_resp.status_code == 200:
            genres_list = genres_resp.json().get("genres", [])
            genres_map = {g["id"]: g["name"] for g in genres_list}
        for movie in data.get("results", []):
            movie["genre_names"] = [genres_map.get(gid, "") for gid in movie.get("genre_ids", [])]
        return jsonify(data)

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
            "tmdb_id": tmdb_id,
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
    JWTManager(app)
    with app.app_context():
        Path("./migrations").mkdir(exist_ok=True)
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=8000)

