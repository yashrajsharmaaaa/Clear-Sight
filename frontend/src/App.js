import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Camera from './components/Camera';
import Registration from './components/Registration';
import Recognition from './components/Recognition';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('camera');

  const renderPage = () => {
    switch (currentPage) {
      case 'camera':
        return <Camera />;
      case 'registration':
        return <Registration />;
      case 'recognition':
        return <Recognition />;
      case 'dashboard':
        return <Dashboard />;
      default:
        return <Camera />;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🔍 Clear Sight</h1>
        <p>Advanced Facial Recognition System</p>
      </header>

      <nav className="nav-bar">
        <button 
          className={currentPage === 'camera' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setCurrentPage('camera')}
        >
          📷 Camera
        </button>
        <button 
          className={currentPage === 'registration' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setCurrentPage('registration')}
        >
          ➕ Register
        </button>
        <button 
          className={currentPage === 'recognition' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setCurrentPage('recognition')}
        >
          🔍 Recognize
        </button>
        <button 
          className={currentPage === 'dashboard' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setCurrentPage('dashboard')}
        >
          📊 Dashboard
        </button>
      </nav>

      <main className="main-content">
        {renderPage()}
      </main>

      <footer className="footer">
        <p>Clear Sight © 2025 - Portfolio Project</p>
      </footer>
    </div>
  );
}

export default App;