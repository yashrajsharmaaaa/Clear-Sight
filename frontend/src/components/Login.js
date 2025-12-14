import React, { useState, useEffect } from 'react';
import authService from '../services/auth';
import '../App.css';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if authentication is enabled
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isEnabled = await authService.isAuthEnabled();
      setAuthRequired(isEnabled);
      
      // If auth is not required, auto-login
      if (!isEnabled) {
        onLoginSuccess();
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setAuthRequired(false);
      onLoginSuccess(); // Assume no auth required on error
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(username, password);
      onLoginSuccess();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.msg ||
                          'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2>ClearSight</h2>
          <p>Checking authentication status...</p>
        </div>
      </div>
    );
  }

  if (!authRequired) {
    return null; // Auth not required, component will unmount after onLoginSuccess
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>ClearSight Login</h2>
        <p className="login-subtitle">Employee Attendance System</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-info">
          <p>🔒 Secure authentication enabled</p>
          <p className="login-hint">Default: admin / ClearSight@2024!Secure</p>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .login-box {
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 400px;
        }

        .login-box h2 {
          margin: 0 0 10px 0;
          color: #333;
          text-align: center;
          font-size: 28px;
        }

        .login-subtitle {
          text-align: center;
          color: #666;
          margin: 0 0 30px 0;
          font-size: 14px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #333;
          font-weight: 500;
          font-size: 14px;
        }

        .form-group input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 5px;
          font-size: 14px;
          transition: border-color 0.3s;
          box-sizing: border-box;
        }

        .form-group input:focus {
          outline: none;
          border-color: #667eea;
        }

        .form-group input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 12px;
          border-radius: 5px;
          margin-bottom: 20px;
          font-size: 14px;
          border-left: 4px solid #c33;
        }

        .login-button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-info {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          text-align: center;
        }

        .login-info p {
          margin: 8px 0;
          font-size: 13px;
          color: #666;
        }

        .login-hint {
          font-family: monospace;
          background-color: #f5f5f5;
          padding: 8px;
          border-radius: 4px;
          font-size: 12px !important;
        }
      `}</style>
    </div>
  );
}

export default Login;
