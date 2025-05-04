import apiClient from "@/lib/apiClient";
import { TSignUpSchema } from "@/lib/shema";

import { AxiosResponse } from "axios";

export class UserService {
  async registerUser(data: TSignUpSchema): Promise<AxiosResponse<any>> {
    const response = await apiClient.post("/register", data);
    const token = response.data.user.token;
    if (token) {
      localStorage.setItem("token", token);
    }
    return response;
  }

  async loginUser(data: any): Promise<AxiosResponse<any>> {
    console.log("loginuserdata", data);

    const response = await apiClient.post("/login", data);
    console.log("checktheresponse", response);
    const token = response.data.user.token;
    if (token) {
      localStorage.setItem("token", token);
    }
    return response;
  }

  async getUserProfile(): Promise<AxiosResponse<any>> {
    return apiClient.get("/user/profile");
  }

  async logoutUser(): Promise<AxiosResponse<any>> {
    localStorage.removeItem("token");
    return apiClient.post("/auth/logout");
  }

  async getAllUsers(): Promise<AxiosResponse<any>> {
    return apiClient.get("/getAllUsers");
  }
}
