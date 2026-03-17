const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// ── 환경변수 (GitHub Secrets에서 주입) ──
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── 분석 대상 종목 ──
const TARGET_TICKERS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA',
  'AMD', 'AVGO', 'TSM',
  'JPM', 'V', 'MA',
  'JNJ', 'UNH', 'LLY',
  'KO', 'PG', 'COST',
];

// ── 시스템 프롬프트 ──
const SYSTEM_PROMPT = `너는 월스트리트 수석 애널리스트야.
주어진 종목의 최신 실적/뉴스 정보를 바탕으로 반드시 아래 JSON 포맷으로만 출력해.

{
  "ticker": "종목 티커",
  "quarter": "분기 (예: Q1 2025)",
  "eps_status": "Beat 또는 Miss 또는 Meet",
  "revenue_status": "Beat 또는 Miss 또는 Meet",
  "summary_3_lines": ["핵심 요약 1", "핵심 요약 2", "핵심 요약 3"],
  "market_reaction": "시장 반응 한 줄 요약",
  "key_quote": "CEO/CFO의 가장 중요한 발언 인용"
}

규칙:
- 반드시 위 JSON 포맷만 출력할 것
- 한국어로 작성
- 팩트 기반, 추측 금지
- summary_3_lines는 정확히 3개
- 가장 최근 분기 실적 기준으로 작성`;

/**
 * Financial Modeling Prep API로 실적 데이터 가져오기 (무료 API)
 * 대안: Alpha Vantage, Yahoo Finance 등
 */
async function fetchEarningsData(ticker) {
  try {
    const FMP_KEY = process.env.FMP_API_KEY;

    if (FMP_KEY) {
      // Financial Modeling Prep API 사용
      const url = `https://financialmodelingprep.com/api/v3/earning_call_transcript/${ticker}?limit=1&apikey=${FMP_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.length > 0) {
        return {
          transcript: data[0].content?.substring(0, 3000) || '', // 토큰 절약
          quarter: data[0].quarter ? `Q${data[0].quarter} ${data[0].year}` : '',
        };
      }
    }

    // FMP 키가 없으면 OpenAI에게 자체 지식으로 분석 요청
    return {
      transcript: '',
      quarter: '',
    };
  } catch (err) {
    console.log(`[${ticker}] 실적 데이터 가져오기 실패, AI 자체 분석으로 대체`);
    return { transcript: '', quarter: '' };
  }
}

/**
 * 이미 오늘 생성된 요약인지 확인 (중복 방지)
 */
async function alreadySummarizedToday(ticker) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { data } = await supabase
    .from('earnings_summaries')
    .select('id')
    .eq('ticker', ticker)
    .gte('created_at', `${today}T00:00:00`)
    .limit(1);

  return data && data.length > 0;
}

/**
 * 하나의 종목에 대해 AI 요약 생성 후 DB 저장
 */
async function generateAndSaveEarningsSummary(ticker) {
  try {
    // 중복 체크
    if (await alreadySummarizedToday(ticker)) {
      console.log(`[${ticker}] 오늘 이미 요약됨, 스킵`);
      return;
    }

    console.log(`[${ticker}] 실적 요약 시작...`);

    // 1. 실적 데이터 가져오기
    const { transcript, quarter } = await fetchEarningsData(ticker);

    // 2. OpenAI API 호출
    const userMessage = transcript
      ? `아래 ${ticker}의 실적 발표 원문을 분석해 JSON으로 줘.\n\n[원문 데이터]\n${transcript}`
      : `${ticker}의 가장 최근 분기 실적을 네가 알고 있는 정보 기준으로 분석해 JSON으로 줘. 모르면 가장 최근에 알고 있는 분기로 작성해.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.2,
    });

    // 3. JSON 파싱
    const summaryData = JSON.parse(response.choices[0].message.content);
    console.log(`[${ticker}] AI 요약 완료: ${summaryData.quarter} - EPS ${summaryData.eps_status}`);

    // 4. Supabase DB에 저장 (upsert: 같은 ticker+quarter면 업데이트)
    const { error } = await supabase
      .from('earnings_summaries')
      .upsert(
        [{
          ticker: summaryData.ticker || ticker,
          quarter: summaryData.quarter,
          eps_status: summaryData.eps_status,
          revenue_status: summaryData.revenue_status,
          summary_3_lines: summaryData.summary_3_lines,
          market_reaction: summaryData.market_reaction,
          key_quote: summaryData.key_quote,
        }],
        { onConflict: 'ticker,quarter', ignoreDuplicates: false }
      );

    if (error) {
      // upsert 실패 시 일반 insert 시도
      const { error: insertError } = await supabase
        .from('earnings_summaries')
        .insert([{
          ticker: summaryData.ticker || ticker,
          quarter: summaryData.quarter,
          eps_status: summaryData.eps_status,
          revenue_status: summaryData.revenue_status,
          summary_3_lines: summaryData.summary_3_lines,
          market_reaction: summaryData.market_reaction,
          key_quote: summaryData.key_quote,
        }]);

      if (insertError) throw insertError;
    }

    console.log(`[${ticker}] DB 저장 완료!`);

    // API 레이트 리밋 방지 (1초 대기)
    await new Promise((r) => setTimeout(r, 1000));
  } catch (error) {
    console.error(`[${ticker}] 오류:`, error.message);
  }
}

/**
 * 메인 실행
 */
async function main() {
  console.log('========================================');
  console.log('  Daily US Stocks AI Summary');
  console.log(`  실행 시각: ${new Date().toISOString()}`);
  console.log(`  대상 종목: ${TARGET_TICKERS.length}개`);
  console.log('========================================\n');

  let success = 0;
  let fail = 0;

  for (const ticker of TARGET_TICKERS) {
    try {
      await generateAndSaveEarningsSummary(ticker);
      success++;
    } catch {
      fail++;
    }
  }

  console.log(`\n========================================`);
  console.log(`  완료! 성공: ${success} / 실패: ${fail}`);
  console.log('========================================');
}

main();
