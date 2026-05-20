import { create } from "zustand";
import { socket } from "@/lib/socket";
import { supabase } from "@/utils/supabaseClient";

type AuthState = {
  token: string | null;
  userId: string | null;
  isReady: boolean;
  initialize: () => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  isReady: false,

  initialize: () => {
    // Get current session immediately
    supabase.auth.getSession().then(({ data }) => {
      set({
        token: data.session?.access_token ?? null,
        userId: data.session?.user?.id ?? null,
        isReady: true,
      });
    });

    // Keep token fresh on every auth event (login, logout, token refresh)
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        token: session?.access_token ?? null,
        userId: session?.user?.id ?? null,
        isReady: true,
      });
    });
  },

  logout: async () => {
    socket.auth = {};
    socket.disconnect();
    await supabase.auth.signOut();
    set({ token: null, userId: null });
  },
}));