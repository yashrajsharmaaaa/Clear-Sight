import { useState, lazy, Suspense } from 'react';
import './App.css';

// Implement code splitting with lazy loading
const Registration = lazy(() => import('./components/Registration'));
const Recognition = lazy(() => import('./components/Recognition'));
const Dashboard = lazy(() => import('./components/Dashboard'));

// Loading component
const LoadingComponent = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
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

  const NavButton = ({ page, icon, label, description }) => {
    const isActive = currentPage === page;
    const [isHovered, setIsHovered] = useState(false);

    return (
      <button
        onClick={() => setCurrentPage(page)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: '100%',
          padding: '16px 20px',
          backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : (isHovered ? 'rgba(255,255,255,0.05)' : 'transparent'),
          color: 'white',
          border: 'none',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          transition: 'all 0.2s ease',
          borderLeft: isActive ? '4px solid #3b82f6' : '4px solid transparent',
          position: 'relative',
          marginBottom: 4
        }}
      >
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: isActive ? '#3b82f6' : 'rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          transition: 'all 0.2s ease',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: 15, 
            fontWeight: 600,
            marginBottom: 2,
            color: isActive ? '#60a5fa' : 'white'
          }}>
            {label}
          </div>
          <div style={{ 
            fontSize: 11, 
            opacity: 0.7,
            color: '#cbd5e1'
          }}>
            {description}
          </div>
        </div>
        {isActive && (
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)'
          }} />
        )}
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 280,
        backgroundColor: '#0f172a',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0,0,0,0.2)',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        zIndex: 100
      }}>
        {/* Logo/Header */}
        <div style={{
          padding: '28px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 8
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}>
              👁️
            </div>
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: 22, 
                fontWeight: 700,
                letterSpacing: '-0.5px'
              }}>
                Clear Sight
              </h1>
              <p style={{ 
                margin: '2px 0 0 0', 
                fontSize: 12, 
                opacity: 0.6,
                fontWeight: 400
              }}>
                AI Recognition
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '24px 12px', overflowY: 'auto' }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#64748b',
            padding: '0 12px 12px 12px',
            marginBottom: 8
          }}>
            Main Menu
          </div>
          
          <NavButton 
            page="registration"
            icon="➕"
            label="Registration"
            description="Add new employees"
          />
          
          <NavButton 
            page="recognition"
            icon="📸"
            label="Recognition"
            description="Live face detection"
          />
          
          <NavButton 
            page="dashboard"
            icon="📊"
            label="Dashboard"
            description="View attendance & logs"
          />
        </nav>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: 'rgba(0,0,0,0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16
            }}>
              👤
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>System Admin</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>Administrator</div>
            </div>
          </div>
          <div style={{
            fontSize: 10,
            opacity: 0.5,
            textAlign: 'center',
            paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.05)'
          }}>
            Clear Sight © 2025
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        marginLeft: 280,
        flex: 1,
        overflow: 'auto',
        backgroundColor: '#f8fafc'
      }}>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;