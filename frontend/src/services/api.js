import axios from 'axios';
import authService from './auth';

// Use environment variable for API URL or default to localhost:5000
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with optimized settings
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: false
});

// Add request/response interceptors for better error handling and authentication
api.interceptors.request.use(
  (config) => {
    // Add JWT token if available
    const authHeaders = authService.getAuthHeader();
    config.headers = {
      ...config.headers,
      ...authHeaders
    };
    
    // Add timestamp to GET requests to prevent browser caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: new Date().getTime()
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      authService.logout();
      // Optionally redirect to login page
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Debounce function to prevent excessive API calls
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

class ApiService {
  // Enhanced cache for frequently accessed data
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.cacheTimeout = 60000; // 60 seconds (increased from 30)
    this.cachePriority = {
      users: 120000,      // 2 minutes for users data
      logs: 60000,        // 1 minute for logs
      stats: 30000        // 30 seconds for stats (frequently changing)
    };
  }

  // Helper method for cached requests with improved caching strategy
  async getCached(key, apiCall) {
    // Check if we have a valid cached response
    const cached = this.cache.get(key);
    const cacheTime = this.cachePriority[key] || this.cacheTimeout;
    
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.data;
    }
    
    // Check if there's already a pending request for this key
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }
    
    // Create a new request promise
    const requestPromise = apiCall().then(data => {
      // Store in cache
      this.cache.set(key, { data, timestamp: Date.now() });
      // Remove from pending requests
      this.pendingRequests.delete(key);
      return data;
    }).catch(error => {
      // Remove from pending requests on error
      this.pendingRequests.delete(key);
      throw error;
    });
    
    // Store the pending request
    this.pendingRequests.set(key, requestPromise);
    return requestPromise;
  }


  // User registration with improved error handling and cache management
  async registerUser(name, email, imageData, employeeId, department, age, gender) {
    try {
      // Validate image data
      if (!imageData || !imageData.includes('base64')) {
        return {
          success: false,
          error: 'Invalid image data'
        };
      }
      
      // Send JSON data
      const requestData = {
        name: name,
        email: email,
        employee_id: employeeId,
        department: department,
        age: age,
        gender: gender,
        image_data: imageData
      };
      
      const response = await api.post('/api/register', requestData);
      
      // Clear specific caches after successful registration
      this.clearCache('users');
      this.clearCache('stats');
      
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed. Please try again.'
      };
    }
  }
  
  // Helper to convert base64 to blob
  base64ToBlob(base64, mimeType) {
    try {
      const byteString = atob(base64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      return new Blob([ab], { type: mimeType });
    } catch (error) {
      throw new Error('Failed to convert image data: ' + error.message);
    }
  }

  // Face recognition with improved error handling for continuous operation
  async recognizeFace(imageData) {
    try {
      if (!imageData || !imageData.includes('base64')) {
        return {
          recognized: false,
          error: 'Invalid image data format',
          message: 'Invalid image data. Please try again.'
        };
      }
      
      const response = await api.post('/api/recognize', {
        image_data: imageData
      });
      
      this.cache.delete('logs');
      this.cache.delete('stats');
      return response.data;
    } catch (error) {
      return {
        recognized: false,
        error: error.response?.data?.error || error.message || 'Recognition failed',
        message: error.response?.data?.message || 'Face recognition failed. Please try again.',
        status: error.response?.status
      };
    }
  }

  // Get all users with optimized caching
  async getUsers() {
    return this.getCached('users', async () => {
      const response = await api.get('/api/users');
      return response.data;
    });
  }
  
  // Debounced version for UI components
  debouncedGetUsers = debounce(async (callback) => {
    try {
      const data = await this.getUsers();
      callback(data);
    } catch (error) {
      callback([], error);
    }
  }, 300);

  // Get recognition logs with optimized caching
  async getLogs() {
    return this.getCached('logs', async () => {
      const response = await api.get('/api/logs');
      return response.data;
    });
  }
  
  // Debounced version for UI components
  debouncedGetLogs = debounce(async (callback) => {
    try {
      const data = await this.getLogs();
      callback(data);
    } catch (error) {
      callback([], error);
    }
  }, 300);

  // Get system stats with optimized caching and fallback
  async getSystemStats() {
    try {
      return await this.getCached('stats', async () => {
        const response = await api.get('/api/stats');
        return response.data;
      });
    } catch (error) {
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
  
  // Debounced version for UI components
   debouncedGetStats = debounce(async (callback) => {
     try {
       const data = await this.getSystemStats();
       callback(data);
     } catch (error) {
       callback({}, error);
     }
   }, 300);
   
  // Clear specific cache entries or all cache
  clearCache(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Get user by ID
  async getUser(userId) {
    const response = await api.get(`/api/user/${userId}`);
    return response.data;
  }

  // Export recognition logs
  async exportLogs() {
    const response = await api.get('/api/export/logs');
    return response.data;
  }

  // Get recognition logs with optional limit parameter
  async getRecognitionLogs(limit = 50) {
    try {
      const response = await api.get('/api/recognition-logs', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch recognition logs. Please try again.';
      throw new Error(errorMessage);
    }
  }

  // Delete user by ID
  async deleteUser(userId) {
    try {
      const response = await api.delete(`/api/user/${userId}`);
      // Clear caches after deletion
      this.clearCache('users');
      this.clearCache('stats');
      this.clearCache('logs');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete user');
    }
  }
}

export default new ApiService();