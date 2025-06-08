"use client"

import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import "./main.css"

function Main() {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleStartReviewing = () => {
    const token = localStorage.getItem("access_token")
    if (token) {
      navigate("/filmy")
    } else {
      navigate("/login")
    }
  }

  const handleGenerateReview = () => {
    navigate("/recenzja")
  }

  return (
    <div className="hero">
      <div className="hero-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className={`hero-content ${isVisible ? "visible" : ""}`}>
        <div className="hero-header">
          <h1 className="hero-title">
            Odkryj <span className="highlight">Nowe Filmy</span>
            <br />z <span className="ai-text">AI Recenzjami</span>
          </h1>
          <p className="hero-subtitle">
            Generuj inteligentne recenzje filmów za pomocą sztucznej inteligencji.
            <br />
            Poznaj nowe produkcje i znajdź swoje następne ulubione filmy.
          </p>
        </div>

        <div className="hero-features">
          <div className="feature-card">
            <Link to="/recenzja">
              <div className="feature-icon">🎭</div>
              <h3>Losowe Recenzje</h3>
              <p>Generuj recenzje losowych filmów i odkrywaj nowe gatunki</p>
            </Link>
          </div>
          <div className="feature-card">
            <Link to="/filmy">
              <div className="feature-icon">🎬</div>
              <h3>Popularne Filmy</h3>
              <p>Przeglądaj listę popularnych filmów z AI recenzjami</p>
            </Link>
          </div>
          {/* <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Analiza</h3>
            <p>Inteligentne analizy fabuły, aktorstwa i reżyserii</p>
          </div> */}
        </div>

        <div className="hero-actions">
          <button className="cta-primary" onClick={handleGenerateReview}>
            <span className="button-text">Generuj Recenzję</span>
            <span className="button-icon">✨</span>
          </button>
          <button className="cta-secondary" onClick={handleStartReviewing}>
            <span className="button-text">Przeglądaj Filmy</span>
            <span className="button-icon">🎬</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Main
