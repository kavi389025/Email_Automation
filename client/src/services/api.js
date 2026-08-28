import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('mailsense_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors uniformly
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data || {};
    const formattedError = {
      status: error.response?.status || 500,
      code: errorData.code || 'UNKNOWN_ERROR',
      message: errorData.message || error.message || 'An unexpected error occurred.',
      errors: errorData.errors || [],
    };

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      if (
        formattedError.code === 'INVALID_TOKEN' ||
        formattedError.code === 'UNAUTHORIZED' ||
        formattedError.code === 'USER_NOT_FOUND'
      ) {
        localStorage.removeItem('mailsense_token');
        localStorage.removeItem('mailsense_user');
      }
    }

    return Promise.reject(formattedError);
  }
);

export default api;
