import axios from 'axios';
import { getOrCreateDeviceId } from '@/lib/e2ee';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError(error)) {
    const data: any = error.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data?.message && typeof data.message === 'string') return data.message;
    if (data?.error && typeof data.error === 'string') return data.error;

    // Common validation formats: { errors: [{ message: "..." }]} or { errors: ["..."] }
    const errors = data?.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0];
      if (typeof first === 'string') return first;
      if (first?.message && typeof first.message === 'string') return first.message;
    }

    if (error.message) return error.message;
  }



  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

// Add a request interceptor to include the auth token and device ID in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add Device ID for E2EE support
    const deviceId = getOrCreateDeviceId();
    if (deviceId) {
      config.headers['x-device-id'] = deviceId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, { refreshToken });
          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token expired or invalid
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
