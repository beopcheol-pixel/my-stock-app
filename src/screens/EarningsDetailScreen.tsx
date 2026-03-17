import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EarningsSummary } from '../store/useEarningsStore';

const C = {
  bg: '#121212',
  card: '#1E1E1E',
  cardBorder: '#2A2A2A',
  white: '#FFFFFF',
  gray1: '#B0B0B0',
  gray2: '#6B6B6B',
  green: '#00D959',
  red: '#FF4444',
  greenBg: 'rgba(0,217,89,0.12)',
  redBg: 'rgba(255,68,68,0.12)',
};

const statusColor = (status: string) => {
  if (status === 'Beat') return C.green;
  if (status === 'Miss') return C.red;
  return '#FF9800';
};
const statusBg = (status: string) => {
  if (status === 'Beat') return C.greenBg;
  if (status === 'Miss') return C.redBg;
  return 'rgba(255,152,0,0.12)';
};

interface Props {
  route: { params: { item: EarningsSummary } };
  navigation: any;
}

export default function EarningsDetailScreen({ route, navigation }: Props) {
  const { item } = route.params;
  const lines = Array.isArray(item.summary_3_lines) ? item.summary_3_lines : [];

  return (
    <SafeAreaView style={ds.container}>
      {/* 상단 헤더 */}
      <View style={ds.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={ds.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.white} />
        </TouchableOpacity>
        <Text style={ds.headerTitle}>실적 상세</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={ds.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* 종목 정보 카드 */}
        <View style={ds.topCard}>
          <View style={ds.logoCircle}>
            <Text style={ds.logoText}>{item.ticker.charAt(0)}</Text>
          </View>
          <Text style={ds.ticker}>{item.ticker}</Text>
          <Text style={ds.quarter}>{item.quarter} Earnings</Text>

          {/* Beat/Miss 뱃지 */}
          <View style={ds.badgeRow}>
            <View style={[ds.badge, { backgroundColor: statusBg(item.eps_status) }]}>
              <Text style={[ds.badgeText, { color: statusColor(item.eps_status) }]}>
                EPS {item.eps_status}
              </Text>
            </View>
            <View style={[ds.badge, { backgroundColor: statusBg(item.revenue_status) }]}>
              <Text style={[ds.badgeText, { color: statusColor(item.revenue_status) }]}>
                Revenue {item.revenue_status}
              </Text>
            </View>
          </View>
        </View>

        {/* AI 핵심 요약 */}
        <View style={ds.section}>
          <View style={ds.sectionTitleRow}>
            <Ionicons name="sparkles" size={18} color={C.green} />
            <Text style={ds.sectionTitle}>AI 핵심 요약</Text>
          </View>
          {lines.map((line, i) => (
            <View key={i} style={ds.summaryItem}>
              <Text style={ds.summaryNumber}>{i + 1}</Text>
              <Text style={ds.summaryText}>{line}</Text>
            </View>
          ))}
        </View>

        {/* 핵심 인용문 */}
        {item.key_quote && (
          <View style={ds.section}>
            <View style={ds.sectionTitleRow}>
              <Ionicons name="chatbubble-outline" size={18} color={C.green} />
              <Text style={ds.sectionTitle}>핵심 발언</Text>
            </View>
            <View style={ds.quoteCard}>
              <View style={ds.quoteBar} />
              <View style={{ flex: 1 }}>
                <Text style={ds.quoteText}>"{item.key_quote}"</Text>
              </View>
            </View>
          </View>
        )}

        {/* 시장 반응 */}
        {item.market_reaction && (
          <View style={ds.section}>
            <View style={ds.sectionTitleRow}>
              <Ionicons name="trending-up-outline" size={18} color={C.green} />
              <Text style={ds.sectionTitle}>시장 반응</Text>
            </View>
            <View style={ds.reactionCard}>
              <Text style={[ds.reactionText, { color: C.green }]}>
                {item.market_reaction}
              </Text>
            </View>
          </View>
        )}

        {/* 생성 시간 */}
        <Text style={ds.timestamp}>
          AI 분석 시각: {new Date(item.created_at).toLocaleString('ko-KR')}
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const ds = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: C.white,
    fontSize: 17,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // 종목 정보
  topCard: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: C.cardBorder,
  },
  logoText: {
    color: C.white,
    fontSize: 30,
    fontWeight: '700',
  },
  ticker: {
    color: C.white,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  quarter: {
    color: C.gray2,
    fontSize: 15,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // 섹션
  section: {
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: '700',
  },

  // 요약
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  summaryNumber: {
    color: C.green,
    fontSize: 18,
    fontWeight: '800',
    marginRight: 14,
    marginTop: 1,
  },
  summaryText: {
    flex: 1,
    color: '#E0E0E0',
    fontSize: 15,
    lineHeight: 24,
  },

  // 인용문
  quoteCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,217,89,0.06)',
    borderRadius: 14,
    padding: 18,
  },
  quoteBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: C.green,
    marginRight: 16,
  },
  quoteText: {
    color: '#D0D0D0',
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 24,
  },

  // 시장 반응
  reactionCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  reactionText: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },

  // 타임스탬프
  timestamp: {
    color: C.gray2,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
