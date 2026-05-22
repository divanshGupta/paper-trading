import axios from "axios";
import { useServerErrorStore } from "@/stores/useServerErrorStore";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token to every request automatically
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("sb_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  return config;
});

// Handle token expiry globally
apiClient.interceptors.response.use(
  (response) => {
    // Backend working again
    useServerErrorStore.getState().setServerError(false);

    return response;
  },

  (error) => {
  console.log("INTERCEPTOR ERROR:", error);

  if (
    !error.response ||
    error.code === "ECONNABORTED" ||
    error.response.status >= 500
  ) {
    console.log("SETTING SERVER ERROR TRUE");

    useServerErrorStore
      .getState()
      .setServerError(true);
  }

  return Promise.reject(error);
}

  
);

export default apiClient;