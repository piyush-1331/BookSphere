import axios from 'axios';

/**
 * Express Backend API Base URL.
 * Strictly configurable via VITE_API_BASE_URL environment variable.
 * Defaults to port 5000 in development.
 */
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
// Normalize base URL: strip trailing slashes and remove optional '/api' suffix
// so that endpoints starting with '/api' never result in duplicate '/api/api'
const API_BASE_URL = rawBaseUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Supports HttpOnly authentication session cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor: Attach JWT Bearer token if stored in localStorage
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Extract meaningful error messages & handle session invalidation
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = {
      message: 'An unexpected network error occurred. Please check your connection.',
      code: 'NETWORK_ERROR',
      status: error.response?.status || 500,
      details: null,
    };

    if (error.response?.data) {
      const data = error.response.data;
      if (data.error) {
        normalizedError.message = data.error.message || normalizedError.message;
        normalizedError.code = data.error.code || normalizedError.code;
        normalizedError.details = data.error.details || null;
      } else if (data.message) {
        normalizedError.message = data.message;
      }
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      normalizedError.message = 'The server took too long to respond. Request timed out.';
      normalizedError.code = 'REQUEST_TIMEOUT';
      normalizedError.status = 504;
    }

    // Auto-clear invalid session token on 401
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (!url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
        localStorage.removeItem('token');
      }
    }

    return Promise.reject(normalizedError);
  }
);

// Modular API services calling the Express backend
export const api = {
  // Authentication
  auth: {
    login: (credentials) => axiosClient.post('/api/auth/login', credentials),
    register: (userData) => axiosClient.post('/api/auth/register', userData),
    logout: () => axiosClient.post('/api/auth/logout'),
    getMe: () => axiosClient.get('/api/auth/me'),
    checkAdmin: () => axiosClient.get('/api/auth/admin-check'),
  },

  // Book Catalog
  books: {
    getAll: (params = {}) => axiosClient.get('/api/books', { params }),
    getById: (id) => axiosClient.get(`/api/books/${id}`),
    create: (bookData) => axiosClient.post('/api/admin/books', bookData),
    update: (id, bookData) => axiosClient.patch(`/api/admin/books/${id}`, bookData),
    delete: (id) => axiosClient.delete(`/api/admin/books/${id}`),
  },

  // Patron Favorites
  favorites: {
    getAll: () => axiosClient.get('/api/favorites'),
    add: (bookId, notes = '') => axiosClient.post(`/api/favorites/${bookId}`, { notes }),
    remove: (bookId) => axiosClient.delete(`/api/favorites/${bookId}`),
  },

  // Book Lending Circulation
  borrows: {
    borrow: (payload) => axiosClient.post('/api/borrows', payload),
    getMy: (params = {}) => axiosClient.get('/api/borrows/my', { params }),
    getById: (id) => axiosClient.get(`/api/borrows/${id}`),
    returnBook: (id) => axiosClient.patch(`/api/borrows/${id}/return`),
    getAll: (params = {}) => axiosClient.get('/api/borrows', { params }),
    auditOverdue: () => axiosClient.post('/api/admin/books/audit-overdue'),
    approve: (id) => axiosClient.patch(`/api/borrows/${id}/approve`),
    reject: (id, reason = '') =>
      axiosClient.patch(`/api/borrows/${id}/reject`, { reason }),
  },

  // AI Recommendation Engine
  recommendations: {
    get: (payload = {}) => axiosClient.post('/api/recommendations', payload),
  },

  // Patron Profile & User Directory
  users: {
    getProfile: () => axiosClient.get('/api/users/profile'),
    updateProfile: (profileData) => axiosClient.put('/api/users/profile', profileData),
    getAll: (params = {}) => axiosClient.get('/api/users', { params }),
  },

  // Admin Operational Services
  admin: {
    getDashboardStats: () => axiosClient.get('/api/admin/books/dashboard/stats'),
  },
};

export default axiosClient;
