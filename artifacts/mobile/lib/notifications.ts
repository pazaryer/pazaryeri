import Constants from 'expo-constants';
import { Platform } from 'react-native';

let handlerConfigured = false;

function configureNotificationHandler() {
  if (handlerConfigured || Constants.appOwnership === 'expo') return;
  handlerConfigured = true;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Constants.appOwnership === 'expo') return null;

  configureNotificationHandler();

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Notifications = require('expo-notifications');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Device = require('expo-device');

  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Pazaryeri',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data as string;

  try {
    const { apiFetch } = await import('./api');
    await apiFetch('/users/me/push-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  } catch {
    // Token registration can fail before auth is ready
  }

  return token;
}
