import api from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  status: string;
  lastSeen: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type AuthResponse = ApiResponse<AuthData>;

const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    const { success, data } = response.data;
    
      if (success && data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return response.data;
  },

  signup: async (userData: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    avatarUrl?: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    const { success, data } = response.data;

    if (success && data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return response.data;
  },

  logout: async () => {
    try {
      const { clearAllKeys } = await import('@/lib/e2ee');
      await clearAllKeys();
    } catch (err) {
      console.error('Failed to clear E2EE keys:', err);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (err) {
        console.error('Logout API call failed:', err);
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('deviceId');
    window.location.href = '/login';
  },
  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    const user = response.data.data || response.data;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  getCurrentUser: (): User | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export default authService;
