import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from './SkeletonPlaceholder';

// 실적 카드 스켈레톤 (로딩 중 표시)
export default function SkeletonEarningsCard() {
  return (
    <View style={styles.card}>
      {/* 상단: 로고 원형 + 티커명 + 뱃지 */}
      <View style={styles.topRow}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={styles.tickerArea}>
          <Skeleton width={80} height={18} borderRadius={6} />
          <Skeleton
            width={140}
            height={13}
            borderRadius={4}
            style={{ marginTop: 8 }}
          />
        </View>
        <Skeleton width={56} height={28} borderRadius={8} />
      </View>

      {/* 구분선 */}
      <View style={styles.divider} />

      {/* EPS / 매출 영역 */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Skeleton width={32} height={12} borderRadius={4} />
          <Skeleton
            width={72}
            height={24}
            borderRadius={6}
            style={{ marginTop: 8 }}
          />
          <Skeleton
            width={56}
            height={12}
            borderRadius={4}
            style={{ marginTop: 6 }}
          />
        </View>
        <View style={styles.vertLine} />
        <View style={styles.metricBox}>
          <Skeleton width={32} height={12} borderRadius={4} />
          <Skeleton
            width={72}
            height={24}
            borderRadius={6}
            style={{ marginTop: 8 }}
          />
          <Skeleton
            width={56}
            height={12}
            borderRadius={4}
            style={{ marginTop: 6 }}
          />
        </View>
      </View>

      {/* 구분선 */}
      <View style={styles.divider} />

      {/* 3줄 요약 스켈레톤 */}
      <Skeleton
        width={100}
        height={13}
        borderRadius={4}
        style={{ marginBottom: 16 }}
      />
      {[290, 260, 220].map((w, i) => (
        <View key={i} style={styles.summaryRow}>
          <Skeleton width={6} height={6} borderRadius={3} />
          <Skeleton
            width={w}
            height={14}
            borderRadius={4}
            style={{ marginLeft: 12 }}
          />
        </View>
      ))}

      {/* 인용문 영역 */}
      <View style={styles.quoteArea}>
        <Skeleton width={3} height={48} borderRadius={2} />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Skeleton width={'90%'} height={14} borderRadius={4} />
          <Skeleton
            width={100}
            height={12}
            borderRadius={4}
            style={{ marginTop: 10 }}
          />
        </View>
      </View>

      {/* 시장 반응 */}
      <View style={styles.reactionRow}>
        <Skeleton width={60} height={13} borderRadius={4} />
        <Skeleton width={120} height={14} borderRadius={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickerArea: {
    flex: 1,
    marginLeft: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginVertical: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  vertLine: {
    width: 1,
    height: 60,
    backgroundColor: '#2A2A2A',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quoteArea: {
    flexDirection: 'row',
    backgroundColor: 'rgba(44,44,44,0.4)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
