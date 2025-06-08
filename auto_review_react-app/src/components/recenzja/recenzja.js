"use client"

import { useState } from "react"
import "./recenzja.css"

export default function Recenzja() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState([])
  const [commentLoading, setCommentLoading] = useState(false)

  const fetchComments = async (tmdb_id) => {
    const token = localStorage.getItem("access_token")
    try {
      const res = await fetch(`http://localhost:8000/api/movies/${tmdb_id}/comments`, {
        headers: { "Authorization": `Bearer ${token}` },
      })
      const data = await res.json()
      setComments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const fetchReview = async () => {
    setLoading(true)
    try {
      const response = await fetch("http://localhost:8000/api/test-combined/random")
      const result = await response.json()
      setData(result)
      if (result.movie?.tmdb_id) {
        fetchComments(result.movie.tmdb_id)
      }
    } catch (error) {
      console.error("Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveComment = async () => {
    if (!data || !data.movie || !data.movie.tmdb_id || !comment.trim()) return
    
    setCommentLoading(true)
    const token = localStorage.getItem("access_token")
    
    try {
      const response = await fetch(`http://localhost:8000/api/movies/${data.movie.tmdb_id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ comment }),
      })
      
      if (response.ok) {
        setComment("")
        fetchComments(data.movie.tmdb_id)
      }
    } catch (error) {
      console.error("Error saving comment:", error)
    } finally {
      setCommentLoading(false)
    }
  }

  return (
    <div className="recenzja-wrapper">
      <div className="recenzja-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="recenzja-container">
        <div className="recenzja-header">
          <h1>Generator Recenzji AI</h1>
          <p>Wygeneruj losową recenzję filmu za pomocą sztucznej inteligencji</p>
        </div>

        <div className="generate-section">
          <button 
            onClick={fetchReview} 
            disabled={loading}
            className="generate-button"
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                <span>Generowanie...</span>
              </>
            ) : (
              <>
                <span>Generuj Recenzję</span>
                <span className="btn-icon">✨</span>
              </>
            )}
          </button>
        </div>

        {data && (
          <div className="recenzja-content">
            <div className="movie-section">
              <div className="movie-poster">
                <img
                  src={`https://image.tmdb.org/t/p/w500${data.movie.poster_path}`}
                  alt={data.movie.title}
                />
              </div>
              
              <div className="movie-details">
                <h2 className="movie-title">{data.movie.title}</h2>
                
                <div className="movie-genres">
                  {data.movie.genres?.map((genre, index) => (
                    <span key={index} className="genre-tag">
                      {genre}
                    </span>
                  ))}
                </div>

                <div className="movie-info-grid">
                  <div className="info-item">
                    <span className="info-label">Ocena TMDB:</span>
                    <span className="info-value">
                      <span className="rating-icon">⭐</span>
                      {data.movie.rating || "-"}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Premiera:</span>
                    <span className="info-value">{data.movie.release_date}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Reżyser:</span>
                    <span className="info-value">{data.movie.directors?.join(", ")}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Scenariusz:</span>
                    <span className="info-value">{data.movie.writers?.join(", ")}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Aktorzy:</span>
                    <span className="info-value">{data.movie.actors?.join(", ")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="review-section">
              <div className="review-card">
                <div className="review-header">
                  <h3>Recenzja AI</h3>
                  <span className="ai-badge">🤖 AI Generated</span>
                </div>
                <div className="review-content">
                  {data.review}
                </div>
              </div>

              <div className="comments-section">
                <h4>Komentarze</h4>
                
                <div className="comment-form">
                  <textarea
                    placeholder="Napisz swój komentarz..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="comment-input"
                  />
                  <button 
                    onClick={saveComment} 
                    disabled={commentLoading || !comment.trim()}
                    className="comment-submit"
                  >
                    {commentLoading ? (
                      <>
                        <span className="loading-spinner-small"></span>
                        Dodawanie...
                      </>
                    ) : (
                      <>
                        <span>Dodaj komentarz</span>
                        <span className="btn-icon">💬</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="comments-list">
                  {comments.length === 0 ? (
                    <p className="no-comments">Brak komentarzy. Bądź pierwszy!</p>
                  ) : (
                    comments.map((c, i) => (
                      <div key={i} className="comment-item">
                        <div className="comment-author">{c.username}</div>
                        <div className="comment-content">{c.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
