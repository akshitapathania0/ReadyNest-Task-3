import { create } from "zustand";
import { api } from "../api/axios";

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: true, // true until the initial /auth/me check resolves
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  checkAuth: async () => {
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    set({ user: data, isAuthenticated: true, isLoading: false });
    return data;
  },

  register: async (formData) => {
    // formData is a FormData instance (supports optional profile image upload)
    const { data } = await api.post("/auth/register", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    set({ user: data, isAuthenticated: true, isLoading: false });
    return data;
  },

  logout: async () => {
    await api.post("/auth/logout");
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
