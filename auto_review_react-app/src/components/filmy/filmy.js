import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Filmy() {
  const [movies, setMovies] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Pobierz listę popularnych filmów z backendu (proxy do TMDb)
    fetch("http://localhost:8000/api/movies")
      .then(res => res.json())
      .then(data => setMovies(data.results || []));
  }, []);

  const handleGenerate = (tmdb_id) => {
    // Przekieruj do recenzji z danym tmdb_id
    navigate(`/recenzja?tmdb_id=${tmdb_id}`);
  };

  return (
    <div style={{ padding: 32 }}>
      {movies.map(movie => (
        <div key={movie.id} style={{
          display: "flex",
          alignItems: "center",
          border: "2px solid black",
          marginBottom: 24,
          padding: 16,
          gap: 32
        }}>
          <img
            src={movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : ""}
            alt={movie.title}
            style={{ width: 100, height: 150, objectFit: "cover", border: "2px solid black" }}
          />
          <div style={{ flex: 2, fontWeight: "bold" }}>{movie.title}</div>
          <div style={{ flex: 2 }}>{movie.genre_names?.join(", ") || "brak danych"}</div>
          <button
            style={{ flex: 1, border: "2px solid black", background: "white", fontWeight: "bold" }}
            onClick={() => handleGenerate(movie.id)}
          >
            Generuj
          </button>
        </div>
      ))}
    </div>
  );
}

export default Filmy;