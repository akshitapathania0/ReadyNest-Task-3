import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // send/receive the httpOnly JWT cookie
});

// Normalize error messages so components can just read err.message
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error || err.message || "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export { API_URL };
