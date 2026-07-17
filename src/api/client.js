import axios from 'axios';
import { STORAGE_KEYS } from '../constants/storage.js';

const apiURL = import.meta.env.VITE_API_URL;

if (!apiURL) {
  throw new Error('VITE_API_URL environment variable is required. Please set it in your .env configuration.');
}

export const apiClient = axios.create({
  baseURL: apiURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject the JWT auth header dynamically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor simply passes errors through so the application context can handle them
apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);
