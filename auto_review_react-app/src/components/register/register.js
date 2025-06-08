"use client"

import { useState } from "react"
import axios from "axios"
import { useNavigate, Link } from "react-router-dom"
import Swal from "sweetalert2"
import "./register.css"

function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleRegister(e) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const requestBody = { email, password }

      await axios.post("http://localhost:8000/api/register", requestBody)

      Swal.fire({
        icon: "success",
        title: "Konto utworzone!",
        text: "Możesz się teraz zalogować.",
        background: "#1e293b",
        color: "#f8fafc",
        confirmButtonColor: "#a855f7",
      })
      navigate("/login")
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Rejestracja nieudana",
        text: error.response?.data?.message || "Coś poszło nie tak",
        background: "#1e293b",
        color: "#f8fafc",
        confirmButtonColor: "#ef4444",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="register-wrapper">
      <div className="register-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      <div className="register-container">
        <div className="register-header">
          <h2>Utwórz konto</h2>
          <p className="subtitle">Dołącz do społeczności miłośników kina!</p>
        </div>

        <form onSubmit={handleRegister} className="register-form">
          <div className="form-group">
            <label htmlFor="email">Adres email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="twoj@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="register-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Tworzenie konta...
              </>
            ) : (
              <>
                <span>ZAREJESTRUJ SIĘ</span>
                <span className="button-icon">🎬</span>
              </>
            )}
          </button>

          <p className="auth-link">
            Masz już konto? <Link to="/login">Zaloguj się</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Register
