"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "./filmy.css"

function Filmy() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch("http://localhost:8000/api/movies")
      .then(res => res.json())
      .then(data => {
        setMovies(data.results || [])
        setLoading(false)
      })
      .catch(error => {
        console.error("Error fetching movies:", error)
        setLoading(false)
      })
  }, [])

  const handleMovieClick = (tmdb_id) => {
    navigate(`/film?tmdb_id=${tmdb_id}`)
  }

  if (loading) {
    return (
      <div className="filmy-wrapper">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Ładowanie filmów...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="filmy-wrapper">
      <div className="filmy-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="filmy-container">
        <div className="filmy-header">
          <h1>Popularne Filmy</h1>
          <p>Wybierz film i wygeneruj dla niego recenzję AI</p>
        </div>

        <div className="movies-grid">
          {movies.map(movie => (
            <div 
              key={movie.id} 
              className="movie-card"
              onClick={() => handleMovieClick(movie.id)}
            >
              <div className="movie-poster">
                <img
                  src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "/placeholder.svg?height=600&width=400"}
                  alt={movie.title}
                  loading="lazy"
                />
                <div className="movie-overlay">
                  <div className="movie-info">
                    <h3 className="movie-title">{movie.title}</h3>
                    <div className="movie-genres">
                      {movie.genre_names?.slice(0, 3).map((genre, index) => (
                        <span key={index} className="genre-tag">
                          {genre}
                        </span>
                      ))}
                    </div>
                    <div className="movie-rating">
                      <span className="rating-icon">⭐</span>
                      <span>{movie.vote_average?.toFixed(1) || "N/A"}</span>
                    </div>
                    <button className="generate-btn">
                      <span>Generuj Recenzję</span>
                      <span className="btn-icon">✨</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Filmy
