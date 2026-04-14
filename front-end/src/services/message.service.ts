import api from './api';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  nonce?: string;
  isEncrypted?: boolean;
  messageType: 'text' | 'image' | 'file';
  fileUrl: string | null;
  isEdited: boolean;
  replyToId: string | null;
  createdAt: string;
  updatedAt: string;
  isMe?: boolean;
}

export interface MessagePayload {
  chatId: string;
  content: string;
  nonce?: string;
  isEncrypted?: boolean;
  messageType: 'text' | 'image' | 'file';
  createdAt?: string;
}

export interface MessagesResponse {
  success: boolean;
  data: Message[];
}

export interface SingleMessageResponse {
  success: boolean;
  data: Message;
}

const messageService = {
  getMessagesByChatId: async (chatId: string): Promise<MessagesResponse> => {
    const response = await api.get(`/messages/${chatId}`);
    return response.data;
  },

  sendMessage: async (payload: MessagePayload): Promise<SingleMessageResponse> => {
    const response = await api.post('/messages', payload);
    return response.data;
  },

  deleteMessage: async (id: string): Promise<void> => {
    await api.delete(`/messages/${id}`);
  }
};

export default messageService;
