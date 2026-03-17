import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // 현재 세션 확인 (앱 시작 시 호출)
  checkSession: () => Promise<void>;
  // 이메일 회원가입
  signUp: (email: string, password: string) => Promise<boolean>;
  // 이메일 로그인
  signIn: (email: string, password: string) => Promise<boolean>;
  // 로그아웃
  signOut: () => Promise<void>;
  // 에러 초기화
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  checkSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({
          user: { id: session.user.id, email: session.user.email || '' },
          isLoading: false,
        });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }

    if (data.user) {
      set({
        user: { id: data.user.id, email: data.user.email || '' },
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
    return true;
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }

    if (data.user) {
      set({
        user: { id: data.user.id, email: data.user.email || '' },
        isLoading: false,
      });
    }
    return true;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
