import axios from 'axios';

// Use environment variable for API URL or default to localhost:5000
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
console.log('API Base URL:', API_BASE_URL);

// Create axios instance with optimized settings
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: false
});

// Add request/response interceptors for better error handling and caching
api.interceptors.request.use(
  (config) => {
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
    console.error('API Error:', error.response?.data?.error || error.message);
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
      console.log(`Using cached data for ${key}`);
      return cached.data;
    }
    
    // Check if there's already a pending request for this key
    if (this.pendingRequests.has(key)) {
      console.log(`Joining pending request for ${key}`);
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
  // Face detection with improved error handling
  async detectFace(imageData) {
    try {
      const response = await api.post('/api/detect-face', { image_data: imageData });
      return response.data;
    } catch (error) {
      console.error('Face detection failed:', error);
      // Return structured error for better UI handling
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to detect face. Please try again.'
      };
    }
  }

  // User registration with improved error handling and cache management
  async registerUser(name, email, imageData, employeeId, department) {
    try {
      console.log('Sending registration request to:', API_BASE_URL + '/api/register');
      
      // Validate image data
      if (!imageData) {
        console.error('No image data provided');
        return {
          success: false,
          error: 'No image data provided'
        };
      }
      
      if (!imageData.includes('base64')) {
        console.error('Invalid image data format: missing base64 encoding');
        return {
          success: false,
          error: 'Invalid image data format: Image must be base64 encoded'
        };
      }
      
      // Send JSON data instead of FormData
      const requestData = {
        name: name,
        email: email,
        employee_id: employeeId,
        department: department,
        image_data: imageData
      };
      
      console.log('Sending registration data as JSON');
      
      const response = await api.post('/api/register', requestData);
      // api instance already has Content-Type: application/json header set
      
      // Clear specific caches after successful registration
      this.clearCache('users');
      this.clearCache('stats');
      
      return response.data;
    } catch (error) {
      console.error('Registration error details:', error);
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
      
      const blob = new Blob([ab], { type: mimeType });
      console.log('Created blob from base64 data, size:', blob.size, 'bytes');
      return blob;
    } catch (error) {
      console.error('Error converting base64 to blob:', error);
      throw new Error('Failed to convert image data: ' + error.message);
    }
  }

  // Face recognition (clears logs cache)
  async recognizeFace(imageData) {
    try {
      if (!imageData || !imageData.includes('base64')) {
        console.error('Invalid image data format for recognition');
        throw new Error('Invalid image data format');
      }
      
      console.log('Sending recognition request to:', API_BASE_URL + '/api/recognize');
      const response = await api.post('/api/recognize', {
        image_data: imageData
      });
      
      this.cache.delete('logs'); // Clear logs cache after recognition
      this.cache.delete('stats'); // Clear stats cache
      return response.data;
    } catch (error) {
      console.error('Recognition error details:', error);
      throw error;
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
      console.error('Failed to fetch users:', error);
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
      console.error('Failed to fetch logs:', error);
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
  
  // Debounced version for UI components
   debouncedGetStats = debounce(async (callback) => {
     try {
       const data = await this.getSystemStats();
       callback(data);
     } catch (error) {
       console.error('Failed to fetch stats:', error);
       callback({}, error);
     }
   }, 300);
   
   // Clear specific cache entries
   clearCache(key) {
     if (key) {
       console.log(`Clearing cache for ${key}`);
       this.cache.delete(key);
     } else {
       console.log('Clearing all cache');
       this.cache.clear();
     }
   }

  // Clear cache when data changes
  clearCache() {
    this.cache.clear();
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