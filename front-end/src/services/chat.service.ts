import api from './api';
import { User } from './auth.service';

export interface Chat {
  id: string;
  name?: string;
  type: 'direct' | 'group';
  avatarUrl: string;
  participants: User[];
  otherUser: User;
  lastMessage?: any;
  createdAt: string;
  updatedAt: string;
  isExistingChat: boolean;
  
}


export interface SingleChatResponse {
  success: boolean;
  data: Chat;
  message?: string;
  type: 'EXISTING_CHAT' | 'NEW_CHAT';
}

export interface ChatsResponse {
  success: boolean;
  data: Chat[];
  nextCursor: string | null;
  message?: string;
}


const chatService = {
  getChats: async (): Promise<ChatsResponse> => {
    const response = await api.get('/chats');
    return response.data;
  },

  getChatById: async (id: string): Promise<SingleChatResponse> => {
    const response = await api.get(`/chats/${id}`);
    return response.data;
  },

  createChat: async (data: {
    name?: string;
    type: 'direct' | 'group';
    participantIds: string[];
  }): Promise<SingleChatResponse> => {
    const response = await api.post('/chats', data);
    return response.data;
  },

  updateChat: async (id: string, name: string): Promise<SingleChatResponse> => {
    const response = await api.patch(`/chats/${id}`, { name });
    return response.data;
  },

  deleteChat: async (id: string): Promise<void> => {
    await api.delete(`/chats/${id}`);
  }
};

export default chatService;
