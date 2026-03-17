import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// ── 알림 표시 설정 (앱이 열려있을 때도 알림 보이게) ──
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 푸시 알림 권한 요청 + Expo Push Token 발급
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // 실제 기기에서만 동작 (시뮬레이터/웹 제외)
  if (!Device.isDevice) {
    console.log('푸시 알림은 실제 기기에서만 가능합니다');
    return null;
  }

  // Android 채널 설정
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('earnings', {
      name: '실적 브리핑',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00D959',
      sound: 'default',
    });
  }

  // 권한 확인
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // 권한 없으면 요청
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('푸시 알림 권한이 거부되었습니다');
    return null;
  }

  // Expo Push Token 발급
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'my-stock-app', // app.json의 slug
    });
    console.log('Push Token:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.log('Push Token 발급 실패:', error);
    return null;
  }
}

/**
 * 로컬 알림 보내기 (테스트용 또는 앱 내부 알림)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: 'default',
    },
    trigger: null, // 즉시 발송
  });
}

/**
 * 매일 아침 알림 스케줄 (KST 06:30)
 */
export async function scheduleDailyBriefing() {
  // 기존 스케줄 삭제
  await Notifications.cancelAllScheduledNotificationsAsync();

  // 매일 반복 알림 설정
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '오늘의 주식 AI 브리핑',
      body: '미국 주식 실적 요약이 준비되었어요. 확인해보세요!',
      data: { screen: 'Home' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 6,
      minute: 30,
    },
  });

  console.log('매일 06:30 브리핑 알림 스케줄 설정 완료');
}

/**
 * 알림 리스너 설정 (알림 터치 시 특정 화면으로 이동)
 */
export function addNotificationResponseListener(
  callback: (notification: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
