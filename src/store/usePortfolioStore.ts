import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';

export interface PortfolioItem {
  ticker: string;
}

interface PortfolioState {
  portfolio: string[];
  isLoading: boolean;

  fetchPortfolio: () => Promise<void>;
  addTicker: (ticker: string) => Promise<void>;
  removeTicker: (ticker: string) => Promise<void>;
  hasTicker: (ticker: string) => boolean;
}

// 현재 로그인된 유저 ID 가져오기
async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolio: [],
  isLoading: false,

  fetchPortfolio: async () => {
    const userId = await getUserId();
    if (!userId) return;

    set({ isLoading: true });
    const { data, error } = await supabase
      .from('user_portfolio')
      .select('ticker')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const tickers = data.map((item: any) => item.ticker as string);
      set({ portfolio: tickers });
    }
    set({ isLoading: false });
  },

  addTicker: async (ticker: string) => {
    const userId = await getUserId();
    if (!userId) return;

    const upperTicker = ticker.toUpperCase();
    const currentPortfolio = get().portfolio;

    if (currentPortfolio.includes(upperTicker)) return;

    // Optimistic UI
    set({ portfolio: [...currentPortfolio, upperTicker] });

    const { error } = await supabase
      .from('user_portfolio')
      .insert([{ user_id: userId, ticker: upperTicker }]);

    if (error) {
      console.error('추가 실패:', error);
      set({ portfolio: currentPortfolio });
    }
  },

  removeTicker: async (ticker: string) => {
    const userId = await getUserId();
    if (!userId) return;

    const currentPortfolio = get().portfolio;

    set({ portfolio: currentPortfolio.filter((t) => t !== ticker) });

    const { error } = await supabase
      .from('user_portfolio')
      .delete()
      .match({ user_id: userId, ticker: ticker });

    if (error) {
      console.error('삭제 실패:', error);
      set({ portfolio: currentPortfolio });
    }
  },

  hasTicker: (ticker: string) => {
    return get().portfolio.includes(ticker.toUpperCase());
  },
}));
