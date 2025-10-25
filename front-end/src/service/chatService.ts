import apiClient from "@/lib/apiClient";
import { AxiosResponse } from "axios";

export class ChatService {
  async getAllChats(): Promise<AxiosResponse<any>> {
    return apiClient.get("/chat");
  }

  async createChat(id: number): Promise<AxiosResponse> {
    return apiClient.post("/chat-create", {
      "recipient_id": id,
    });
  }
}
