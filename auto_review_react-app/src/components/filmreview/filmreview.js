import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function FilmReview() {
  const query = useQuery();
  const tmdb_id = query.get("tmdb_id");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  useEffect(() => {
  if (!tmdb_id) return;

  const generateAndFetch = async () => {
    setLoading(true);
    await fetch(`http://localhost:8000/api/movies/${tmdb_id}/handle_review`, { method: "POST" });
    pollUntilReviewExists();
  };

  const pollUntilReviewExists = async () => {
    for (let i = 0; i < 10; i++) {
      const res = await fetch(`http://localhost:8000/api/movies/${tmdb_id}`);
      const movieData = await res.json();
      if (movieData.reviews && movieData.reviews.length > 0) {
        setData(movieData);
        setLoading(false);
        fetchComments(tmdb_id);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    setData(null);
    setLoading(false);
  };

  generateAndFetch();
}, [tmdb_id]);


  const fetchComments = async (tmdb_id) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`http://localhost:8000/api/movies/${tmdb_id}/comments`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    const data = await res.json();
    setComments(Array.isArray(data) ? data : []);
  };

  const saveComment = async () => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`http://localhost:8000/api/movies/${tmdb_id}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ comment }),
    });
    if (res.ok) {
      setComment("");
      fetchComments(tmdb_id);
    }
  };

  const renderGenres = (genres) => genres?.map((g, i) => (
    <span key={i} className="tag">{g}</span>
  ));

  if (loading) return <div>Ładowanie...</div>;
  if (!data) return <div>Brak danych o filmie.</div>;

  return (
    <div className="App">
      <header>
        <h1 className="Title">Recenzja wybranego filmu</h1>
      </header>
      <main className="main-content">
        <div className="content-wrapper">
          <div className="ImgDiv">
            <img
              src={`https://image.tmdb.org/t/p/w500${data.poster_path}`}
              alt={data.title}
              width={400}
              height={600}
            />
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <div className="genres">{renderGenres(data.genres)}</div>
              <p><strong>Ocena TMDB:</strong> {data.rating || "-"}</p>
              <p><strong>Premiera:</strong> {data.release_date}</p>
              <p><strong>Tytuł:</strong> {data.title}</p>
              <p><strong>Reżyser:</strong> {data.directors?.join(" | ")}</p>
              <p><strong>Scenariusz:</strong> {data.writers?.join(" | ")}</p>
              <p><strong>Aktorzy:</strong> {data.actors?.join(" | ")}</p>
            </div>
          </div>
          <div className="ReviewDiv">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Card>
                <CardContent>
                  <h3>Recenzja:</h3>
                  <p className="space-y-4">
                    {data.reviews && data.reviews.length > 0
                      ? data.reviews[0].content
                      : "Recenzja jeszcze się generuje..."}
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
              <Button className="mt-2" onClick={saveComment} variant="outline">Dodaj komentarz</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}