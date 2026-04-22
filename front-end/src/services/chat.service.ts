import api from './api';
import { User } from './auth.service';

export interface ChatParticipant {
  userId: string;
  role: string;
  username?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  lastSeen?: string | null;
  joinedAt?: string;
}

export interface Chat {
  id: string;
  name?: string;
  type: 'direct' | 'group';
  avatarUrl: string;
  participants: ChatParticipant[];
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

export interface AddMemberResponse {
  success: boolean;
  data: any;
  message?: string;
}

export interface ChatMemberSearchResult {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  isAlreadyMember?: boolean;
}

export interface ChatMembersResponse {
  success: boolean;
  data: ChatMemberSearchResult[];
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

  addMember: async (chatId: string, userId: string, role: "admin" | "member" = "member"): Promise<AddMemberResponse> => {
    const response = await api.post(`/chats/${chatId}/add-member`, { userId, role });
    return response.data;
  },

  getChatMembers: async (chatId: string, search?: string): Promise<ChatMembersResponse> => {
    const params = new URLSearchParams();
    if (search && search.trim()) params.set("search", search.trim());
    const qs = params.toString();
    const response = await api.get(`/chats/${chatId}/members${qs ? `?${qs}` : ""}`);
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
