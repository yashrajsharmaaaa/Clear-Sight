import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Log the API URL in development
if (process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', API_BASE_URL);
}

class ApiService {
  // Health check
  async healthCheck() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // API status
  async getStatus() {
    try {
      const response = await api.get('/api/status');
      return response.data;
    } catch (error) {
      console.error('Get status failed:', error);
      throw error;
    }
  }

  // Face detection
  async detectFace(imageData) {
    try {
      const response = await api.post('/api/detect-face', {
        image_data: imageData
      });
      return response.data;
    } catch (error) {
      console.error('Face detection failed:', error);
      throw error;
    }
  }

  // User registration
  async registerUser(name, email, imageData) {
    try {
      const response = await api.post('/api/register', {
        name,
        email,
        image_data: imageData
      });
      return response.data;
    } catch (error) {
      console.error('User registration failed:', error);
      throw error;
    }
  }

  // Face recognition
  async recognizeFace(imageData) {
    try {
      const response = await api.post('/api/recognize', {
        image_data: imageData
      });
      return response.data;
    } catch (error) {
      console.error('Face recognition failed:', error);
      throw error;
    }
  }

  // Get all users
  async getUsers() {
    try {
      const response = await api.get('/api/users');
      return response.data;
    } catch (error) {
      console.error('Get users failed:', error);
      throw error;
    }
  }

  // Get recognition logs
  async getLogs() {
    try {
      const response = await api.get('/api/logs');
      return response.data;
    } catch (error) {
      console.error('Get logs failed:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUser(userId) {
    try {
      const response = await api.get(`/api/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get user failed:', error);
      throw error;
    }
  }

  // Get comprehensive system statistics
  async getSystemStats() {
    try {
      const response = await api.get('/api/stats');
      return response.data;
    } catch (error) {
      console.error('Get system stats failed:', error);
      // Return default stats if API fails
      return {
        totalUsers: 0,
        totalRecognitions: 0,
        avgConfidence: 0,
        recentActivity: 0,
        successRate: 0,
        mostActiveUsers: [],
        systemUptime: 'Unknown',
        faceDetectionMode: 'Unknown'
      };
    }
  }

  // Export recognition logs
  async exportLogs() {
    try {
      const response = await api.get('/api/export/logs');
      return response.data;
    } catch (error) {
      console.error('Export logs failed:', error);
      throw error;
    }
  }
}

export default new ApiService();