import React from 'react';
import './navbar.css';
import { useNavigate, Link } from 'react-router-dom';

const NavBar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="navbar-container">
      <nav className="navbar">
        <div className="logo">
          <Link to="/" className="logo-link">
            <span className="logo-icon">🎬</span>
            <span className="logo-text">AutoReviewByAI</span>
          </Link>
        </div>
        <ul className="nav-links">
          <li><Link to="/" className="nav-link">Main</Link></li>
          <li><Link to="/filmy" className="nav-link">Filmy</Link></li>
          <li><Link to="/recenzja" className="nav-link generuj-btn">Generuj</Link></li>
          {token ? (
            <li><button onClick={handleLogout} className="nav-link auth-btn logout-btn">Log Out</button></li>
          ) : (
            <li><Link to="/login" className="nav-link auth-btn">Log In</Link></li>
          )}
        </ul>
      </nav>
    </div>
  );
}

export default NavBar;
