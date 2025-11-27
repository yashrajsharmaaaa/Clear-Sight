import React, { useState, lazy, Suspense } from 'react';
import './App.css';

// Implement code splitting with lazy loading
const Registration = lazy(() => import('./components/Registration'));
const Recognition = lazy(() => import('./components/Recognition'));
const Dashboard = lazy(() => import('./components/Dashboard'));

// Loading component
const LoadingComponent = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading component...</p>
  </div>
);
function App() {
  const [currentPage, setCurrentPage] = useState('registration');

  const renderPage = () => {
    switch (currentPage) {
      case 'registration':
        return (
          <Suspense fallback={<LoadingComponent />}>
            <Registration />
          </Suspense>
        );
      case 'recognition':
        return (
          <Suspense fallback={<LoadingComponent />}>
            <Recognition />
          </Suspense>
        );
      case 'dashboard':
      default:
        return (
          <Suspense fallback={<LoadingComponent />}>
            <Dashboard />
          </Suspense>
        );
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>👤 Employee Attendance</h1>
        <p>Facial Recognition Attendance System</p>
      </header>

      <nav className="nav-bar">
        <button 
          className={currentPage === 'registration' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setCurrentPage('registration')}
        >
          ➕ Employee Registration
        </button>
        <button 
          className={currentPage === 'recognition' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setCurrentPage('recognition')}
        >
          🔍 Live Recognition
        </button>
        <button 
          className={currentPage === 'dashboard' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setCurrentPage('dashboard')}
        >
          📊 Attendance Dashboard
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