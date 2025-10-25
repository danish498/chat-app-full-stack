import apiClient from "@/lib/apiClient";
import { TSignUpSchema } from "@/lib/shema";

import { AxiosResponse } from "axios";

export class UserService {
  async registerUser(data: TSignUpSchema): Promise<AxiosResponse<any>> {
    const response = await apiClient.post("/register", data);
    const token = response.data.user.token;
    const userData = response.data.user;
    
    if (token) {
      localStorage.setItem("token", token);
      // Store user data for socket connection
      localStorage.setItem("user", JSON.stringify(userData));
      // Also set in cookies for middleware
      document.cookie = `token=${token}; path=/; max-age=86400`; // 24 hours
    }
    return response;
  }

  async loginUser(data: any): Promise<AxiosResponse<any>> {
     

    const response = await apiClient.post("/login", data);
     
    const token = response.data.user.token;
    const userData = response.data.user;
    
    if (token) {
      localStorage.setItem("token", token);
      // Store user data for socket connection
      localStorage.setItem("user", JSON.stringify(userData));
      // Also set in cookies for middleware
      document.cookie = `token=${token}; path=/; max-age=86400`; // 24 hours
    }
    return response;
  }

  async getUserProfile(): Promise<AxiosResponse<any>> {
    return apiClient.get("/user/profile");
  }

  async logoutUser(): Promise<AxiosResponse<any>> {
    localStorage.removeItem("token");
    localStorage.removeItem("user"); // Also remove user data
    // Remove cookie
    document.cookie = "token=; path=/; max-age=0";
    return apiClient.post("/auth/logout");
  }

  async getAllUsers(): Promise<AxiosResponse<any>> {
    return apiClient.get("/getAllUsers");
  }
}
