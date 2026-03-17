import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { usePortfolioStore } from '../store/usePortfolioStore';

// ── 인기 종목 데이터 (섹터별 분류) ──
const POPULAR_STOCKS = [
  // 빅테크
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Tech' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Tech' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Tech' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Tech' },
  { ticker: 'META', name: 'Meta Platforms', sector: 'Tech' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Tech' },
  { ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Tech' },
  // 반도체
  { ticker: 'AMD', name: 'Advanced Micro Devices', sector: 'Semiconductor' },
  { ticker: 'AVGO', name: 'Broadcom Inc.', sector: 'Semiconductor' },
  { ticker: 'TSM', name: 'Taiwan Semiconductor', sector: 'Semiconductor' },
  // 금융
  { ticker: 'JPM', name: 'JPMorgan Chase', sector: 'Finance' },
  { ticker: 'V', name: 'Visa Inc.', sector: 'Finance' },
  { ticker: 'MA', name: 'Mastercard Inc.', sector: 'Finance' },
  // 헬스케어
  { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { ticker: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare' },
  { ticker: 'LLY', name: 'Eli Lilly & Co.', sector: 'Healthcare' },
  // 소비재
  { ticker: 'KO', name: 'Coca-Cola Co.', sector: 'Consumer' },
  { ticker: 'PG', name: 'Procter & Gamble', sector: 'Consumer' },
  { ticker: 'COST', name: 'Costco Wholesale', sector: 'Consumer' },
  // ETF
  { ticker: 'SPY', name: 'S&P 500 ETF', sector: 'ETF' },
  { ticker: 'QQQ', name: 'Nasdaq 100 ETF', sector: 'ETF' },
  { ticker: 'VOO', name: 'Vanguard S&P 500', sector: 'ETF' },
];

const C = {
  bg: '#121212',
  card: '#1E1E1E',
  cardBorder: '#2A2A2A',
  white: '#FFFFFF',
  gray1: '#B0B0B0',
  gray2: '#6B6B6B',
  gray3: '#3A3A3A',
  green: '#00D959',
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AddStockModal({ visible, onClose }: Props) {
  const [searchText, setSearchText] = useState('');
  const { addTicker, hasTicker } = usePortfolioStore();

  // 검색 필터링 (티커 + 회사명 모두 검색)
  const filteredStocks = useMemo(() => {
    if (!searchText.trim()) return POPULAR_STOCKS;
    const query = searchText.toUpperCase().trim();
    return POPULAR_STOCKS.filter(
      (s) =>
        s.ticker.includes(query) ||
        s.name.toUpperCase().includes(query)
    );
  }, [searchText]);

  // 직접 입력한 티커가 목록에 없는 경우 표시
  const isCustomTicker =
    searchText.trim().length >= 1 &&
    !POPULAR_STOCKS.some(
      (s) => s.ticker === searchText.toUpperCase().trim()
    );

  // 종목 추가 핸들러
  const handleAdd = async (ticker: string) => {
    await addTicker(ticker);
  };

  // 직접 입력 티커 추가
  const handleCustomAdd = async () => {
    const ticker = searchText.toUpperCase().trim();
    if (ticker.length < 1) return;
    await addTicker(ticker);
    setSearchText('');
  };

  const handleClose = () => {
    setSearchText('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={ms.overlay}
      >
        <View style={ms.container}>
          {/* 상단 핸들바 + 닫기 */}
          <View style={ms.handleBar} />
          <View style={ms.headerRow}>
            <Text style={ms.title}>종목 추가</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={ms.closeBtn}>닫기</Text>
            </TouchableOpacity>
          </View>

          {/* 검색 입력 */}
          <View style={ms.searchBox}>
            <Text style={ms.searchIcon}>🔍</Text>
            <TextInput
              style={ms.searchInput}
              placeholder="티커 또는 종목명 검색 (예: AAPL)"
              placeholderTextColor="#555"
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Text style={ms.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 직접 입력 추가 버튼 */}
          {isCustomTicker && (
            <TouchableOpacity style={ms.customAdd} onPress={handleCustomAdd}>
              <View style={ms.customCircle}>
                <Text style={ms.customPlus}>+</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ms.customTicker}>
                  "{searchText.toUpperCase().trim()}" 직접 추가
                </Text>
                <Text style={ms.customDesc}>
                  목록에 없는 티커를 직접 등록합니다
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* 섹션 타이틀 */}
          <Text style={ms.sectionLabel}>
            {searchText ? '검색 결과' : '인기 종목'}
          </Text>

          {/* 종목 리스트 */}
          <FlatList
            data={filteredStocks}
            keyExtractor={(item) => item.ticker}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !isCustomTicker ? (
                <Text style={ms.emptyText}>검색 결과가 없습니다</Text>
              ) : null
            }
            renderItem={({ item }) => {
              const added = hasTicker(item.ticker);
              return (
                <TouchableOpacity
                  style={ms.stockRow}
                  onPress={() => !added && handleAdd(item.ticker)}
                  disabled={added}
                  activeOpacity={0.6}
                >
                  <View style={ms.logoCircle}>
                    <Text style={ms.logoText}>{item.ticker.charAt(0)}</Text>
                  </View>
                  <View style={ms.stockInfo}>
                    <Text style={ms.stockTicker}>{item.ticker}</Text>
                    <Text style={ms.stockName}>{item.name}</Text>
                  </View>
                  <View style={ms.sectorBadge}>
                    <Text style={ms.sectorText}>{item.sector}</Text>
                  </View>
                  {added ? (
                    <View style={ms.addedBadge}>
                      <Text style={ms.addedText}>추가됨</Text>
                    </View>
                  ) : (
                    <View style={ms.addBtn}>
                      <Text style={ms.addBtnText}>+</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: C.gray3,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: C.white,
    fontSize: 22,
    fontWeight: '700',
  },
  closeBtn: {
    color: C.green,
    fontSize: 16,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: C.white,
    fontSize: 15,
    padding: 0,
  },
  clearBtn: {
    color: C.gray2,
    fontSize: 16,
    paddingLeft: 8,
  },
  customAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,217,89,0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,217,89,0.2)',
  },
  customCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customPlus: {
    color: '#000',
    fontSize: 22,
    fontWeight: '700',
  },
  customTicker: {
    color: C.green,
    fontSize: 15,
    fontWeight: '700',
  },
  customDesc: {
    color: C.gray2,
    fontSize: 12,
    marginTop: 2,
  },
  sectionLabel: {
    color: C.gray2,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  emptyText: {
    color: C.gray2,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  logoCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    color: C.white,
    fontSize: 17,
    fontWeight: '700',
  },
  stockInfo: {
    flex: 1,
  },
  stockTicker: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },
  stockName: {
    color: C.gray2,
    fontSize: 12,
    marginTop: 2,
  },
  sectorBadge: {
    backgroundColor: C.card,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 10,
  },
  sectorText: {
    color: C.gray1,
    fontSize: 11,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#000',
    fontSize: 20,
    fontWeight: '700',
    marginTop: -1,
  },
  addedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(0,217,89,0.12)',
  },
  addedText: {
    color: C.green,
    fontSize: 12,
    fontWeight: '600',
  },
});
