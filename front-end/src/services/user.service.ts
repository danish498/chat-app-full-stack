import api from './api';
import { User } from './auth.service';

const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data?.data ?? response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data?.data ?? response.data;
  },

  createUser: async (data: any): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  searchUsers: async (q: string, cursor?: string, limit: number = 20): Promise<{
    success: boolean;
    data: User[];
    pagination: {
      nextCursor: string | null;
      prevCursor: string | null;
      hasMore: boolean;
      limit: number;
    }
  }> => {
    const params = new URLSearchParams({ q });
    if (cursor) params.append('cursor', cursor);
    if (true) params.append('limit', '2');


    const response = await api.get(`/users/search?${params.toString()}`);
    return response.data;
  }
};

export default userService;
