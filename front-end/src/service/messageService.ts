import apiClient from "@/lib/apiClient";
// import { Message } from "@/app/data";
import { AxiosResponse } from "axios";

export class MessageService {
  async getAllMessages(chadId: number): Promise<AxiosResponse<any>> {
    return apiClient.get(`/messages/${chadId}`);
  }

  async sendMessage(chatId: number, message: string): Promise<AxiosResponse> {
    return apiClient.post("/message", {
      chat_id: chatId,
      message: message,
    });
  }
}
