"use client";

import React, { useState } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import { Heart, ThumbsUp } from "lucide-react";
import { motion } from "framer-motion";

export default function DriveReview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReview = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/test-combined/random");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
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
          <a href="#">Filmy</a>
          <a href="#">Top</a>
          <a href="#">Moje recenzje</a>
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

              <div className="mt-6">
                <Textarea placeholder="Napisz komentarz..." />
                <div className="icons">
                  <ThumbsUp />
                  <Heart />
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
