import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response;
  },

  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.success && response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token);
      // Get user profile
      const userProfile = await apiClient.get('/auth/me');
      if (userProfile.success) {
        localStorage.setItem('user_data', JSON.stringify(userProfile.data));
      }
    }
    return response;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response;
  }
};

// Movies API
export const moviesAPI = {
  getMovies: async (page = 1, filters = {}) => {
    const params = { page, ...filters };
    const response = await apiClient.get('/movies', { params });
    return response;
  },

  getMovieDetails: async (movieId) => {
    const response = await apiClient.get(`/movies/${movieId}`);
    return response;
  },

  getStreamingSources: async (movieId) => {
    const response = await apiClient.get(`/movies/${movieId}/stream`);
    return response;
  },

  searchMovies: async (query, page = 1) => {
    const response = await apiClient.get('/search', {
      params: { q: query, page }
    });
    return response;
  },

  getTrending: async () => {
    const response = await apiClient.get('/trending');
    return response;
  },

  getGenres: async () => {
    const response = await apiClient.get('/genres');
    return response;
  }
};

// User Features API (requires authentication)
export const userAPI = {
  getFavorites: async (page = 1) => {
    const response = await apiClient.get('/favorites', { params: { page } });
    return response;
  },

  addToFavorites: async (movieData) => {
    const response = await apiClient.post('/favorites', movieData);
    return response;
  },

  removeFromFavorites: async (movieId) => {
    const response = await apiClient.delete(`/favorites/${movieId}`);
    return response;
  },

  getWatchHistory: async (page = 1) => {
    const response = await apiClient.get('/watch-history', { params: { page } });
    return response;
  },

  addToWatchHistory: async (watchData) => {
    const response = await apiClient.post('/watch-history', watchData);
    return response;
  },

  removeFromWatchHistory: async (movieId) => {
    const response = await apiClient.delete(`/watch-history/${movieId}`);
    return response;
  }
};

// Utility functions
export const isAuthenticated = () => {
  const token = localStorage.getItem('auth_token');
  if (!token) return false;
  
  try {
    // Basic token validation (decode JWT to check expiry)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

export const getCurrentUser = () => {
  const userData = localStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
};

// Cache management
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

export const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

export default apiClient;