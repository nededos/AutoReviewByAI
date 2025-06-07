from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

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
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(500), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    film_id = db.Column(db.Integer, nullable=False)
    user = db.relationship('User', backref=db.backref('comments', lazy=True))

