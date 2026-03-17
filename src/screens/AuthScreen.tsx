import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';

const C = {
  bg: '#0A0E1A',
  card: '#141B2D',
  cardBorder: '#1E2A3A',
  white: '#FFFFFF',
  gray1: '#B0B0B0',
  gray2: '#6B6B6B',
  green: '#00D959',
  red: '#FF4444',
};

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, error, signIn, signUp, clearError } = useAuthStore();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;

    if (isSignUp) {
      const success = await signUp(email.trim(), password);
      if (success) {
        // 회원가입 성공 시 자동 로그인됨
      }
    } else {
      await signIn(email.trim(), password);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    clearError();
  };

  return (
    <SafeAreaView style={as.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={as.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 로고 영역 */}
          <View style={as.logoArea}>
            <View style={as.logoBox}>
              <View style={as.barGroup}>
                <View style={[as.bar, { height: 24 }]} />
                <View style={[as.bar, { height: 36 }]} />
                <View style={[as.bar, { height: 52 }]} />
              </View>
            </View>
            <Text style={as.appName}>Stock AI</Text>
            <Text style={as.appDesc}>미국 주식 AI 실적 브리핑</Text>
          </View>

          {/* 로그인/회원가입 카드 */}
          <View style={as.authCard}>
            <Text style={as.title}>
              {isSignUp ? '회원가입' : '로그인'}
            </Text>

            {/* 이메일 입력 */}
            <View style={as.inputBox}>
              <Ionicons name="mail-outline" size={20} color={C.gray2} />
              <TextInput
                style={as.input}
                placeholder="이메일"
                placeholderTextColor="#555"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* 비밀번호 입력 */}
            <View style={as.inputBox}>
              <Ionicons name="lock-closed-outline" size={20} color={C.gray2} />
              <TextInput
                style={as.input}
                placeholder="비밀번호 (6자 이상)"
                placeholderTextColor="#555"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={C.gray2}
                />
              </TouchableOpacity>
            </View>

            {/* 에러 메시지 */}
            {error && (
              <View style={as.errorBox}>
                <Ionicons name="warning-outline" size={16} color={C.red} />
                <Text style={as.errorText}>{error}</Text>
              </View>
            )}

            {/* 로그인/회원가입 버튼 */}
            <TouchableOpacity
              style={[as.submitBtn, (!email || !password) && as.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={as.submitBtnText}>
                  {isSignUp ? '계정 만들기' : '로그인'}
                </Text>
              )}
            </TouchableOpacity>

            {/* 모드 전환 */}
            <TouchableOpacity onPress={toggleMode} style={as.switchRow}>
              <Text style={as.switchText}>
                {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}
              </Text>
              <Text style={as.switchLink}>
                {isSignUp ? ' 로그인' : ' 회원가입'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 하단 안내 */}
          <Text style={as.footer}>
            로그인하면 포트폴리오가 클라우드에 저장되어{'\n'}어디서든 접근할 수 있습니다
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const as = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  // 로고
  logoArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: C.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  barGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  bar: {
    width: 12,
    backgroundColor: C.green,
    borderRadius: 4,
  },
  appName: {
    color: C.white,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  appDesc: {
    color: C.gray2,
    fontSize: 14,
    marginTop: 6,
  },

  // 카드
  authCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  title: {
    color: C.white,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },

  // 입력
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 12,
  },
  input: {
    flex: 1,
    color: C.white,
    fontSize: 16,
    padding: 0,
  },

  // 에러
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,68,68,0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: C.red,
    fontSize: 13,
    flex: 1,
  },

  // 버튼
  submitBtn: {
    backgroundColor: C.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
  },

  // 전환
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  switchText: {
    color: C.gray2,
    fontSize: 14,
  },
  switchLink: {
    color: C.green,
    fontSize: 14,
    fontWeight: '700',
  },

  // 하단
  footer: {
    color: C.gray2,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 20,
  },
});
