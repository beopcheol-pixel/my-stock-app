import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EarningsDetailScreen from './src/screens/EarningsDetailScreen';
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  StyleSheet,
  Animated,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import SkeletonEarningsCard from './src/components/SkeletonEarningsCard';
import AddStockModal from './src/components/AddStockModal';
import {
  useEarningsStore,
  EarningsSummary,
} from './src/store/useEarningsStore';
import { usePortfolioStore } from './src/store/usePortfolioStore';
import { useAuthStore } from './src/store/useAuthStore';
import AuthScreen from './src/screens/AuthScreen';
import { ActivityIndicator } from 'react-native';
import {
  registerForPushNotifications,
  scheduleDailyBriefing,
  sendLocalNotification,
  addNotificationResponseListener,
} from './src/services/notifications';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── 컬러 시스템 ──
const C = {
  bg: '#121212',
  card: '#1E1E1E',
  cardBorder: '#2A2A2A',
  white: '#FFFFFF',
  gray1: '#B0B0B0',
  gray2: '#6B6B6B',
  gray3: '#3A3A3A',
  green: '#00D959',
  red: '#FF4444',
  greenBg: 'rgba(0,217,89,0.12)',
  redBg: 'rgba(255,68,68,0.12)',
};

// S&P 500 더미 (별도 API 연결 전까지 유지)
const SP500_DATA = {
  value: '5,998.74',
  change: '+28.41',
  changePercent: '+0.48%',
  isUp: true,
};

// ── Beat/Miss 색상 헬퍼 ──
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

// ═══════════════════════════════════════
// 실적 카드 컴포넌트 (1개 단위)
// ═══════════════════════════════════════
function EarningsCard({ item, onPress }: { item: EarningsSummary; onPress?: () => void }) {
  const lines = Array.isArray(item.summary_3_lines)
    ? item.summary_3_lines
    : [];

  return (
    <TouchableOpacity
      style={s.earningsCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* 카드 상단: 로고 + 종목 정보 */}
      <View style={s.cardTop}>
        <View style={s.logoCircle}>
          <Text style={s.logoText}>{item.ticker.charAt(0)}</Text>
        </View>
        <View style={s.tickerInfo}>
          <Text style={s.tickerName}>{item.ticker}</Text>
          <Text style={s.companyName}>{item.quarter}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: statusBg(item.eps_status) }]}>
          <Text style={[s.statusText, { color: statusColor(item.eps_status) }]}>
            {item.eps_status}
          </Text>
        </View>
      </View>

      {/* 구분선 */}
      <View style={s.divider} />

      {/* EPS / 매출 뱃지 */}
      <View style={s.metricsRow}>
        <View style={s.metricBox}>
          <Text style={s.metricLabel}>EPS</Text>
          <View style={[s.surpriseBadge, { backgroundColor: statusBg(item.eps_status) }]}>
            <Text style={[s.surpriseText, { color: statusColor(item.eps_status) }]}>
              {item.eps_status === 'Beat' ? '▲' : item.eps_status === 'Miss' ? '▼' : '—'} {item.eps_status}
            </Text>
          </View>
        </View>

        <View style={s.vertDivider} />

        <View style={s.metricBox}>
          <Text style={s.metricLabel}>매출</Text>
          <View style={[s.surpriseBadge, { backgroundColor: statusBg(item.revenue_status) }]}>
            <Text style={[s.surpriseText, { color: statusColor(item.revenue_status) }]}>
              {item.revenue_status === 'Beat' ? '▲' : item.revenue_status === 'Miss' ? '▼' : '—'} {item.revenue_status}
            </Text>
          </View>
        </View>
      </View>

      {/* 구분선 */}
      <View style={s.divider} />

      {/* 3줄 요약 */}
      {lines.length > 0 && (
        <View style={s.summarySection}>
          <Text style={s.summaryTitle}>AI 핵심 요약</Text>
          {lines.map((line, i) => (
            <View key={i} style={s.summaryRow}>
              <View style={s.bulletDot} />
              <Text style={s.summaryText}>{line}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 핵심 인용문 */}
      {item.key_quote ? (
        <View style={s.quoteBox}>
          <View style={s.quoteBar} />
          <View style={s.quoteContent}>
            <Text style={s.quoteText}>"{item.key_quote}"</Text>
          </View>
        </View>
      ) : null}

      {/* 시장 반응 */}
      {item.market_reaction ? (
        <View style={s.reactionRow}>
          <Text style={s.reactionLabel}>시장 반응</Text>
          <Text style={[s.reactionValue, { color: C.green }]}>
            {item.market_reaction}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════
// 빈 상태 컴포넌트
// ═══════════════════════════════════════
function EmptyState() {
  return (
    <View style={s.emptyCard}>
      <Text style={s.emptyIcon}>📭</Text>
      <Text style={s.emptyTitle}>실적 데이터가 없습니다</Text>
      <Text style={s.emptyDesc}>
        아직 AI 요약이 생성되지 않았어요.{'\n'}
        곧 최신 실적 브리핑이 업데이트됩니다.
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════
// 에러 상태 컴포넌트
// ═══════════════════════════════════════
function ErrorState({ message }: { message: string }) {
  return (
    <View style={s.emptyCard}>
      <Text style={s.emptyIcon}>⚠️</Text>
      <Text style={s.emptyTitle}>데이터를 불러오지 못했어요</Text>
      <Text style={s.emptyDesc}>{message}</Text>
    </View>
  );
}

// ═══════════════════════════════════════
// 1번 탭: 홈 (AI 요약 브리핑)
// ═══════════════════════════════════════
function HomeScreen({ navigation }: { navigation: any }) {
  const sp = SP500_DATA;
  const { earningsList, isLoading, error, fetchEarnings } = useEarningsStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 마운트 시 Supabase에서 데이터 fetch
  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  // 로딩 완료 후 페이드인
  useEffect(() => {
    if (!isLoading && earningsList.length > 0) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, earningsList.length, fadeAnim]);

  // Pull-to-refresh 핸들러
  const onRefresh = () => {
    fadeAnim.setValue(0);
    fetchEarnings();
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={onRefresh}
            tintColor={C.green}
          />
        }
      >
        {/* ── 헤더 영역 ── */}
        <View style={s.header}>
          <Text style={s.headerDate}>
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </Text>
          <Text style={s.headerTitle}>오늘의 S&P 500{'\n'}마감 브리핑</Text>
        </View>

        {/* ── S&P 500 마감 카드 ── */}
        <View style={s.spCard}>
          <View style={s.spRow}>
            <View>
              <Text style={s.spLabel}>S&P 500</Text>
              <Text style={s.spValue}>{sp.value}</Text>
            </View>
            <View style={[s.spBadge, sp.isUp ? s.greenBg : s.redBg]}>
              <Text style={[s.spChange, { color: sp.isUp ? C.green : C.red }]}>
                {sp.change} ({sp.changePercent})
              </Text>
            </View>
          </View>
          <View style={s.spBar}>
            <View style={[s.spBarFill, { width: '68%' }]} />
          </View>
          <Text style={s.spRange}>일중 범위 5,942 — 6,012</Text>
        </View>

        {/* ── 섹션 타이틀 ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>어닝 서프라이즈</Text>
          <Text style={s.sectionSub}>AI가 분석한 실적 요약</Text>
        </View>

        {/* ── 스켈레톤 / 에러 / 빈 상태 / 실적 카드 목록 ── */}
        {isLoading ? (
          <>
            <SkeletonEarningsCard />
            <SkeletonEarningsCard />
            <SkeletonEarningsCard />
          </>
        ) : error ? (
          <ErrorState message={error} />
        ) : earningsList.length === 0 ? (
          <EmptyState />
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {earningsList.map((item) => (
              <EarningsCard
                key={item.id}
                item={item}
                onPress={() => navigation.navigate('EarningsDetail', { item })}
              />
            ))}
          </Animated.View>
        )}

        {/* 하단 여백 */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════
// 2번 탭: 포트폴리오
// ═══════════════════════════════════════
function PortfolioScreen({ navigation }: { navigation: any }) {
  const [inputText, setInputText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { portfolio, fetchPortfolio, addTicker, removeTicker } = usePortfolioStore();
  const { earningsList, fetchEarnings } = useEarningsStore();

  useEffect(() => {
    fetchPortfolio();
    fetchEarnings();
  }, [fetchPortfolio, fetchEarnings]);

  // 직접 입력으로 종목 추가
  const handleAdd = () => {
    if (inputText.trim() === '') return;
    addTicker(inputText.trim());
    setInputText('');
  };

  // 포트폴리오 종목의 실적 데이터 찾기
  const getEarnings = (ticker: string) => {
    return earningsList.find((e) => e.ticker === ticker);
  };

  // Beat/Miss 카운트
  const beatCount = earningsList.filter(
    (e) => portfolio.includes(e.ticker) && e.eps_status === 'Beat'
  ).length;
  const missCount = earningsList.filter(
    (e) => portfolio.includes(e.ticker) && e.eps_status === 'Miss'
  ).length;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.headerDate}>내 투자</Text>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
                  { text: '취소', style: 'cancel' },
                  { text: '로그아웃', style: 'destructive', onPress: () => useAuthStore.getState().signOut() },
                ]);
              }}
            >
              <Ionicons name="log-out-outline" size={22} color={C.gray2} />
            </TouchableOpacity>
          </View>
          <Text style={s.headerTitle}>포트폴리오</Text>
        </View>

        {/* ── 직접 입력 + 인기 종목 버튼 ── */}
        <View style={ps.inputRow}>
          <TextInput
            style={ps.tickerInput}
            placeholder="티커 입력 (예: AAPL, NVDA)"
            placeholderTextColor="#555"
            value={inputText}
            onChangeText={setInputText}
            autoCapitalize="characters"
            autoCorrect={false}
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity style={ps.addBtn} onPress={handleAdd}>
            <Text style={ps.addBtnText}>추가</Text>
          </TouchableOpacity>
        </View>

        {/* 인기 종목에서 선택하기 버튼 */}
        <TouchableOpacity style={ps.browseBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="list-outline" size={18} color={C.green} />
          <Text style={ps.browseBtnText}>인기 종목에서 선택하기</Text>
          <Ionicons name="chevron-forward" size={16} color={C.gray2} />
        </TouchableOpacity>

        {portfolio.length > 0 ? (
          <>
            {/* ── 요약 통계 카드 ── */}
            <View style={ps.statsCard}>
              <View style={ps.statItem}>
                <Text style={ps.statNumber}>{portfolio.length}</Text>
                <Text style={ps.statLabel}>관심 종목</Text>
              </View>
              <View style={ps.statDivider} />
              <View style={ps.statItem}>
                <Text style={[ps.statNumber, { color: C.green }]}>{beatCount}</Text>
                <Text style={ps.statLabel}>Beat</Text>
              </View>
              <View style={ps.statDivider} />
              <View style={ps.statItem}>
                <Text style={[ps.statNumber, { color: C.red }]}>{missCount}</Text>
                <Text style={ps.statLabel}>Miss</Text>
              </View>
            </View>

            {/* ── 종목 카드 리스트 ── */}
            {portfolio.map((ticker) => {
              const earnings = getEarnings(ticker);

              return (
                <View key={ticker} style={ps.stockCard}>
                  <View style={ps.cardRow}>
                    <View style={s.logoCircle}>
                      <Text style={s.logoText}>{ticker.charAt(0)}</Text>
                    </View>
                    <View style={s.tickerInfo}>
                      <Text style={s.tickerName}>{ticker}</Text>
                      {earnings ? (
                        <Text style={s.companyName}>{earnings.quarter}</Text>
                      ) : (
                        <Text style={s.companyName}>실적 데이터 없음</Text>
                      )}
                    </View>

                    {/* 삭제 버튼 */}
                    <TouchableOpacity
                      onPress={() => removeTicker(ticker)}
                      style={ps.deleteBtn}
                    >
                      <Text style={ps.deleteBtnText}>삭제</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 실적 뱃지 */}
                  {earnings && (
                    <TouchableOpacity
                      style={ps.earningsRow}
                      onPress={() => navigation.navigate('EarningsDetail', { item: earnings })}
                      activeOpacity={0.7}
                    >
                      <View style={[ps.epsBadge, { backgroundColor: statusBg(earnings.eps_status) }]}>
                        <Text style={[ps.epsBadgeText, { color: statusColor(earnings.eps_status) }]}>
                          EPS {earnings.eps_status}
                        </Text>
                      </View>
                      <View style={[ps.epsBadge, { backgroundColor: statusBg(earnings.revenue_status) }]}>
                        <Text style={[ps.epsBadgeText, { color: statusColor(earnings.revenue_status) }]}>
                          매출 {earnings.revenue_status}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={C.gray2} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </>
        ) : (
          <View style={s.emptyCard}>
            <Text style={s.emptyIcon}>📊</Text>
            <Text style={s.emptyTitle}>아직 등록된 관심 종목이 없습니다</Text>
            <Text style={s.emptyDesc}>
              위에서 티커를 직접 입력하거나{'\n'}인기 종목에서 선택해 보세요
            </Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <AddStockModal visible={showModal} onClose={() => setShowModal(false)} />
    </SafeAreaView>
  );
}

// ── 포트폴리오 전용 스타일 ──
const ps = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 10,
  },
  tickerInput: {
    flex: 1,
    backgroundColor: C.card,
    color: C.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  addBtn: {
    backgroundColor: C.green,
    paddingHorizontal: 24,
    justifyContent: 'center',
    borderRadius: 12,
  },
  addBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,217,89,0.06)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,217,89,0.12)',
  },
  browseBtnText: {
    flex: 1,
    color: C.green,
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: C.white,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: C.gray2,
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: C.cardBorder,
  },


  stockCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },


  deleteBtn: {
    backgroundColor: '#FF4444',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  deleteBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 10,
  },
  epsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  epsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },


});

// ═══════════════════════════════════════
// 앱 루트
// ═══════════════════════════════════════
// 탭 네비게이터 (홈 + 포트폴리오)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A1A',
          borderTopColor: '#2A2A2A',
          borderTopWidth: 0.5,
          height: 56,
          paddingBottom: 6,
        },
        tabBarActiveTintColor: C.green,
        tabBarInactiveTintColor: C.gray2,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: '브리핑',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          tabBarLabel: '포트폴리오',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart-outline" size={size} color={color} />
          ),
        }}
          />
    </Tab.Navigator>
  );
}

// 스택 네비게이터 (메인탭 + 상세화면)
export default function App() {
  const { user, isLoading, checkSession, signOut } = useAuthStore();

  // 앱 시작 시 세션 확인
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // 로그인 후 푸시 알림 설정
  useEffect(() => {
    if (!user) return;

    // 푸시 권한 요청 + 매일 브리핑 알림 스케줄
    registerForPushNotifications().then((token) => {
      if (token) {
        scheduleDailyBriefing();
        // 로그인 환영 알림 (첫 1회)
        sendLocalNotification(
          'Stock AI에 오신 것을 환영합니다!',
          '매일 아침 6:30에 AI 실적 브리핑을 보내드릴게요.'
        );
      }
    });

    // 알림 터치 시 처리
    const subscription = addNotificationResponseListener((response) => {
      const screen = response.notification.request.content.data?.screen;
      // 나중에 navigation으로 특정 화면 이동 가능
      console.log('알림 터치:', screen);
    });

    return () => subscription.remove();
  }, [user]);

  // 로딩 중
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0E1A', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#00D959" />
      </View>
    );
  }

  // 로그인 안 됨 → 로그인 화면
  if (!user) {
    return (
      <>
        <StatusBar style="light" />
        <AuthScreen />
      </>
    );
  }

  // 로그인 됨 → 메인 앱
  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="EarningsDetail"
            component={EarningsDetailScreen as any}
            options={{ animation: 'slide_from_right' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

// ═══════════════════════════════════════
// 스타일
// ═══════════════════════════════════════
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginTop: 12,
    marginBottom: 28,
  },
  headerDate: {
    color: C.gray2,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  headerTitle: {
    color: C.white,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  spCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  spRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spLabel: {
    color: C.gray1,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  spValue: {
    color: C.white,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  spBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  spChange: {
    fontSize: 14,
    fontWeight: '700',
  },
  spBar: {
    height: 4,
    backgroundColor: C.gray3,
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  spBarFill: {
    height: 4,
    backgroundColor: C.green,
    borderRadius: 2,
  },
  spRange: {
    color: C.gray2,
    fontSize: 12,
    marginTop: 8,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: C.white,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSub: {
    color: C.gray2,
    fontSize: 13,
    marginTop: 4,
  },
  earningsCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  logoText: {
    color: C.white,
    fontSize: 20,
    fontWeight: '700',
  },
  tickerInfo: {
    flex: 1,
  },
  tickerName: {
    color: C.white,
    fontSize: 18,
    fontWeight: '700',
  },
  companyName: {
    color: C.gray2,
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: C.cardBorder,
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
  metricLabel: {
    color: C.gray2,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metricActual: {
    color: C.white,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  metricEstimate: {
    color: C.gray2,
    fontSize: 12,
    marginTop: 4,
  },
  surpriseBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  surpriseText: {
    fontSize: 12,
    fontWeight: '700',
  },
  vertDivider: {
    width: 1,
    height: 40,
    backgroundColor: C.cardBorder,
  },
  summarySection: {
    marginBottom: 4,
  },
  summaryTitle: {
    color: C.gray1,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.green,
    marginTop: 7,
    marginRight: 12,
  },
  summaryText: {
    flex: 1,
    color: '#E0E0E0',
    fontSize: 14,
    lineHeight: 22,
  },
  quoteBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,217,89,0.06)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  quoteBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: C.green,
    marginRight: 14,
  },
  quoteContent: {
    flex: 1,
  },
  quoteText: {
    color: '#D0D0D0',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reactionLabel: {
    color: C.gray2,
    fontSize: 13,
  },
  reactionValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  greenBg: {
    backgroundColor: C.greenBg,
  },
  redBg: {
    backgroundColor: C.redBg,
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  portfolioCount: {
    color: C.gray2,
    fontSize: 14,
    fontWeight: '500',
  },
  addStockBtn: {
    backgroundColor: C.green,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addStockBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  portfolioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  removeHint: {
    color: C.gray3,
    fontSize: 11,
  },
  emptyCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyDesc: {
    color: C.gray2,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: C.green,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
});
