"use client"

import { useState } from "react"
import "./login.css"
import axios from "axios"
import { useNavigate, Link } from "react-router-dom"
import Swal from "sweetalert2"

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await axios.post("http://localhost:8000/api/login", {
        email,
        password,
      })
      localStorage.setItem("access_token", response.data.access_token)

      Swal.fire({
        icon: "success",
        title: "Witamy z powrotem!",
        text: "Logowanie przebiegło pomyślnie.",
        background: "#1e293b",
        color: "#f8fafc",
        confirmButtonColor: "#a855f7",
        timer: 2000,
      })

      navigate("/")
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Błąd logowania",
        text: error.response?.data?.message || "Nieprawidłowe dane logowania",
        background: "#1e293b",
        color: "#f8fafc",
        confirmButtonColor: "#ef4444",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      <div className="login-container">
        <div className="login-header">
          <h2>Zaloguj się</h2>
          <p className="subtitle">Witamy z powrotem w świecie kina!</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
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

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Logowanie...
              </>
            ) : (
              <>
                <span>ZALOGUJ SIĘ</span>
                <span className="button-icon">🎭</span>
              </>
            )}
          </button>

          <p className="auth-link">
            Nie masz konta? <Link to="/register">Utwórz konto</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Login
