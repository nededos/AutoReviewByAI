"use client";

import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { motion } from "framer-motion";

export default function DriveReview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  const fetchComments = async (tmdb_id) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`http://localhost:8000/api/movies/${tmdb_id}/comments`, {
        headers: {
        "Authorization": `Bearer ${token}`,
        },
    });
    const data = await res.json();
    setComments(Array.isArray(data) ? data : []);
  };
  
  const fetchReview = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/test-combined/random");
      const result = await response.json();
      setData(result);
      if (result.movie?.tmdb_id) {
        fetchComments(result.movie.tmdb_id);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveComment = async () => {
  console.log("data:", data);
  console.log("data.movie:", data?.movie);
  console.log("data.movie.tmdb_id:", data?.movie?.tmdb_id);
  if (!data || !data.movie || !data.movie.tmdb_id) {
    alert("Brak wybranego filmu.");
    return;
  }
  if (!comment.trim()) {
    alert("Komentarz nie może być pusty.");
    return;
  }
  const token = localStorage.getItem("access_token");
  if (!token) {
    alert("Musisz być zalogowany, aby dodać komentarz.");
    return;
  }
  try {
    const response = await fetch(`http://localhost:8000/api/movies/${data.movie.tmdb_id}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ comment }),
    });
    if (response.ok) {
      alert("Komentarz zapisany!");
      setComment("");
      fetchComments(data.movie.tmdb_id);
    } else {
      const res = await response.json();
      alert("Błąd zapisu: " + (res.message || response.statusText));
    }
  } catch (e) {
    alert("Błąd połączenia: " + e.message);
  }
};



  const renderGenres = (genres) => genres.map((g, i) => (
    <span key={i} className="tag">
      {g}
    </span>
  ));

  return (
    <div className="App">
      <header>
        <h1 className="Title">Dzienny generator recenzji filmów z AI</h1>
        <nav className="NavBar">
          <a href="/movies">Filmy</a>
          <a href="/top">Top</a>
          <a href="/login">Login</a>
        </nav>
      </header>

      <div className="GenerateDiv">
        <section className="GenerateSection">
          <h2>AI recenzje filmów</h2>
          <Button onClick={fetchReview} disabled={loading}>
            {loading ? "Generowanie..." : "Wygeneruj"}
          </Button>
        </section>
      </div>

      {data && (
        <main className="main-content">
          <div className="content-wrapper">
            <div className="ImgDiv">
              <img
                src={`https://image.tmdb.org/t/p/w500${data.movie.poster_path}`}
                alt={data.movie.title}
                width={400}
                height={600}
              />
              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <div className="genres">{renderGenres(data.movie.genres)}</div>
                <p><strong>Ocena TMDB:</strong> {data.movie.rating || "-"}</p>
                <p><strong>Premiera:</strong> {data.movie.release_date}</p>
                <p><strong>Tytuł:</strong> {data.movie.title}</p>
                <p><strong>Reżyser:</strong> {data.movie.directors.join(" | ")}</p>
                <p><strong>Scenariusz:</strong> {data.movie.writers.join(" | ")}</p>
                <p><strong>Aktorzy:</strong> {data.movie.actors.join(" | ")}</p>
              </div>
            </div>

            <div className="ReviewDiv">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card>
                  <CardContent>
                    <h3>Recenzja:</h3>
                    <p className="space-y-4">
                      {data.review}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <div className="comments-section">
                <h4>Komentarze:</h4>
                {comments.length === 0 && <p>Brak komentarzy.</p>}
                <ul>
                    {comments.map((c, i) => (
                        <li key={i}>
                        <strong>{c.username}:</strong> {c.content}
                        </li>
                    ))}
                </ul>
                <Textarea placeholder="Napisz komentarz..."
                  value={comment}
                  onChange={e => setComment(e.target.value)} />
                <div className="icons">
                </div>
                <Button className="mt-2" onClick={saveComment} variant="outline"> Dodaj komentarz </Button>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
