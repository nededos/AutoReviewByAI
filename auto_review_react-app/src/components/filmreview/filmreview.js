"use client"

import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import "./filmreview.css"

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

export default function FilmReview() {
  const query = useQuery()
  const tmdb_id = query.get("tmdb_id")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState([])
  const [commentLoading, setCommentLoading] = useState(false)

  useEffect(() => {
    if (!tmdb_id) return

    const generateAndFetch = async () => {
      setLoading(true)
      await fetch(`http://localhost:8000/api/movies/${tmdb_id}/handle_review`, { method: "POST" })
      pollUntilReviewExists()
    }

    const pollUntilReviewExists = async () => {
      for (let i = 0; i < 10; i++) {
        const res = await fetch(`http://localhost:8000/api/movies/${tmdb_id}`)
        const movieData = await res.json()
        if (movieData.reviews && movieData.reviews.length > 0) {
          setData(movieData)
          setLoading(false)
          fetchComments(tmdb_id)
          return
        }
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
      setData(null)
      setLoading(false)
    }

    generateAndFetch()
  }, [tmdb_id])

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

  const saveComment = async () => {
    if (!comment.trim()) return
    
    setCommentLoading(true)
    const token = localStorage.getItem("access_token")
    
    try {
      const res = await fetch(`http://localhost:8000/api/movies/${tmdb_id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ comment }),
      })
      
      if (res.ok) {
        setComment("")
        fetchComments(tmdb_id)
      }
    } catch (error) {
      console.error("Error saving comment:", error)
    } finally {
      setCommentLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="filmreview-wrapper">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Generowanie recenzji...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="filmreview-wrapper">
        <div className="error-container">
          <h2>Brak danych o filmie</h2>
          <p>Nie udało się wygenerować recenzji</p>
        </div>
      </div>
    )
  }

  return (
    <div className="filmreview-wrapper">
      <div className="filmreview-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      <div className="filmreview-container">
        <div className="filmreview-header">
          <h1>Recenzja Filmu</h1>
        </div>

        <div className="filmreview-content">
          <div className="movie-section">
            <div className="movie-poster">
              <img
                src={`https://image.tmdb.org/t/p/w500${data.poster_path}`}
                alt={data.title}
              />
            </div>
            
            <div className="movie-details">
              <h2 className="movie-title">{data.title}</h2>
              
              <div className="movie-genres">
                {data.genres?.map((genre, index) => (
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
                    {data.rating || "-"}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Premiera:</span>
                  <span className="info-value">{data.release_date}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Reżyser:</span>
                  <span className="info-value">{data.directors?.join(", ")}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Scenariusz:</span>
                  <span className="info-value">{data.writers?.join(", ")}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Aktorzy:</span>
                  <span className="info-value">{data.actors?.join(", ")}</span>
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
                {data.reviews && data.reviews.length > 0
                  ? data.reviews[0].content
                  : "Recenzja jeszcze się generuje..."}
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
      </div>
    </div>
  )
}
