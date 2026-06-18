import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL,
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
  (response) => response,

  (error) => {
    if (error.response?.status === 400) {
      localStorage.removeItem("sb_token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default apiClient;