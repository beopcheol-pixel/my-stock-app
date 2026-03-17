import React, { useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useEarningsStore } from '../store/useEarningsStore';

export default function EarningsScreen() {
  const { earningsList, isLoading, fetchEarnings } = useEarningsStore();

  useEffect(() => {
    fetchEarnings();
  }, []);

  // Beat/Miss/Meet에 따른 색상 반환
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Beat':
        return '#4CAF50'; // 초록 (서프라이즈)
      case 'Miss':
        return '#F44336'; // 빨강 (미스)
      default:
        return '#FF9800'; // 주황 (부합)
    }
  };

  if (isLoading && earningsList.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>실적 데이터 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={earningsList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchEarnings}
            tintColor="#4CAF50"
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>아직 실적 데이터가 없습니다</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* 종목명 + 분기 */}
            <Text style={styles.ticker}>
              {item.ticker} {item.quarter} 실적
            </Text>

            {/* Beat/Miss 뱃지 */}
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: getStatusColor(item.eps_status) + '20' }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(item.eps_status) }]}>
                  EPS {item.eps_status}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: getStatusColor(item.revenue_status) + '20' }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(item.revenue_status) }]}>
                  매출 {item.revenue_status}
                </Text>
              </View>
            </View>

            {/* 3줄 요약 */}
            <View style={styles.summaryBox}>
              {item.summary_3_lines?.map((line: string, index: number) => (
                <Text key={index} style={styles.summaryLine}>
                  • {line}
                </Text>
              ))}
            </View>

            {/* 핵심 인용문 */}
            {item.key_quote && (
              <Text style={styles.quote}>"{item.key_quote}"</Text>
            )}

            {/* 시장 반응 */}
            {item.market_reaction && (
              <Text style={styles.reaction}>📊 {item.market_reaction}</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 14,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 40,
  },
  card: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  ticker: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryBox: {
    marginTop: 14,
  },
  summaryLine: {
    color: '#E0E0E0',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 4,
  },
  quote: {
    color: '#90CAF9',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 12,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#90CAF9',
  },
  reaction: {
    color: '#888',
    fontSize: 13,
    marginTop: 10,
  },
});
