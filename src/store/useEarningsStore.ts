import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';

// ── DB 테이블 스키마와 1:1 매칭되는 타입 ──
export interface EarningsSummary {
  id: string;
  ticker: string;
  quarter: string;
  eps_status: 'Beat' | 'Miss' | 'Meet';
  revenue_status: 'Beat' | 'Miss' | 'Meet';
  summary_3_lines: string[];
  market_reaction: string | null;
  key_quote: string | null;
  created_at: string;
}

interface EarningsState {
  earningsList: EarningsSummary[];
  isLoading: boolean;
  error: string | null;

  // 선택적 ticker 파라미터: 없으면 전체 최신, 있으면 해당 종목만
  fetchEarnings: (ticker?: string) => Promise<void>;
}

export const useEarningsStore = create<EarningsState>((set) => ({
  earningsList: [],
  isLoading: false,
  error: null,

  fetchEarnings: async (ticker?: string) => {
    set({ isLoading: true, error: null });

    try {
      // 기본 쿼리: earnings_summaries 테이블에서 최신순 정렬
      let query = supabase
        .from('earnings_summaries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      // ticker가 있으면 해당 종목만 필터
      if (ticker) {
        query = query.eq('ticker', ticker);
      }

      const { data, error } = await query;

      if (error) throw error;

      set({
        earningsList: (data ?? []) as EarningsSummary[],
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.message ?? 'Failed to fetch earnings',
        isLoading: false,
      });
    }
  },
}));
