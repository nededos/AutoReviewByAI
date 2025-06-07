import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Main from './components/main/main';
import NavBar from './components/navbar/navbar';
import './components/navbar/navbar.css';
import Login from './components/login/login';
import './components/login/login.css';
import Register from './components/register/register';
import './components/register/register.css';
import Recenzja from './components/recenzja/recenzja';
import './components/recenzja/recenzja.css';
// import Filmy from './components/filmy/filmy'; 
// import './components/filmy/filmy.css';

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* <Route path="/filmy" element={<Filmy />} /> */}
        <Route path="/recenzja" element={<Recenzja />} />
      </Routes>
    </Router>
  );
}

export default App;