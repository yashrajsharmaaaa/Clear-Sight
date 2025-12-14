/**
 * Authentication Service
 * 
 * Handles JWT authentication for ClearSight API
 * Only needed when AUTH_ENABLED=true on backend
 */

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class AuthService {
  /**
   * Login and get JWT token
   * @param {string} username - Admin username
   * @param {string} password - Admin password
   * @returns {Promise<string>} JWT access token
   */
  async login(username, password) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password
      });
      
      const { access_token, expires_in } = response.data;
      
      // Store token and expiration time
      localStorage.setItem('token', access_token);
      localStorage.setItem('token_expires', Date.now() + (expires_in * 1000));
      
      return access_token;
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Logout and clear stored token
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('token_expires');
  }

  /**
   * Get stored JWT token
   * @returns {string|null} JWT token or null if not found/expired
   */
  getToken() {
    const token = localStorage.getItem('token');
    const expires = localStorage.getItem('token_expires');
    
    // Check if token exists and hasn't expired
    if (token && expires && Date.now() < parseInt(expires)) {
      return token;
    }
    
    // Token expired or doesn't exist
    this.logout();
    return null;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if valid token exists
   */
  isAuthenticated() {
    return this.getToken() !== null;
  }

  /**
   * Get authorization header for API requests
   * @returns {Object} Headers object with Authorization if token exists
   */
  getAuthHeader() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Check if authentication is enabled on backend
   * @returns {Promise<boolean>} True if auth is enabled
   */
  async isAuthEnabled() {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data.auth_enabled === true;
    } catch (error) {
      console.error('Failed to check auth status:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new AuthService();
