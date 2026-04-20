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
  content?: string;
  messageType: 'text' | 'image' | 'file' | 'video';
  fileUrl?: string | null;
  replyToId?: string | null;
  encryptedPayloads?: { deviceId: string; ciphertext: string; nonce: string }[];
  createdAt?: string;
}

export interface MessagesResponse {
  success: boolean;
  data: Message[];
  nextCursor?: string | null;
}

export interface SingleMessageResponse {
  success: boolean;
  data: Message;
}

const messageService = {
  getMessagesByChatId: async (
    chatId: string,
    cursorValue?: string,
    limit: number = 10,
  ): Promise<MessagesResponse> => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (cursorValue) params.set("cursor", cursorValue);

    const res = await api.get(`/messages/${chatId}?${params.toString()}`);
    return res.data;
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
