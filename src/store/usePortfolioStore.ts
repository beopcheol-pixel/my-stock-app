import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';

// 테스트용 임시 유저 ID (나중에 로그인 기능 연동 시 실제 유저 ID로 교체)
const DUMMY_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

export interface PortfolioItem {
  ticker: string;
}

interface PortfolioState {
  portfolio: string[];       // ['AAPL', 'TSLA', 'MSFT'] 형태
  isLoading: boolean;

  fetchPortfolio: () => Promise<void>;
  addTicker: (ticker: string) => Promise<void>;
  removeTicker: (ticker: string) => Promise<void>;
  hasTicker: (ticker: string) => boolean;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolio: [],
  isLoading: false,

  // 1. 내 관심 종목 불러오기
  fetchPortfolio: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('user_portfolio')
      .select('ticker')
      .eq('user_id', DUMMY_USER_ID)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const tickers = data.map((item: any) => item.ticker as string);
      set({ portfolio: tickers });
    }
    set({ isLoading: false });
  },

  // 2. 관심 종목 추가하기 (Optimistic UI)
  addTicker: async (ticker: string) => {
    const upperTicker = ticker.toUpperCase();
    const currentPortfolio = get().portfolio;

    // 이미 있는 종목이면 무시
    if (currentPortfolio.includes(upperTicker)) return;

    // UI 먼저 즉각 업데이트
    set({ portfolio: [...currentPortfolio, upperTicker] });

    // DB에 저장
    const { error } = await supabase
      .from('user_portfolio')
      .insert([{ user_id: DUMMY_USER_ID, ticker: upperTicker }]);

    if (error) {
      console.error('추가 실패:', error);
      // 실패 시 롤백
      set({ portfolio: currentPortfolio });
    }
  },

  // 3. 관심 종목 삭제하기 (Optimistic UI)
  removeTicker: async (ticker: string) => {
    const currentPortfolio = get().portfolio;

    // UI에서 즉시 삭제
    set({ portfolio: currentPortfolio.filter((t) => t !== ticker) });

    // DB에서 삭제
    const { error } = await supabase
      .from('user_portfolio')
      .delete()
      .match({ user_id: DUMMY_USER_ID, ticker: ticker });

    if (error) {
      console.error('삭제 실패:', error);
      // 실패 시 롤백
      set({ portfolio: currentPortfolio });
    }
  },

  // 4. 이미 추가된 종목인지 확인
  hasTicker: (ticker: string) => {
    return get().portfolio.includes(ticker.toUpperCase());
  },
}));
