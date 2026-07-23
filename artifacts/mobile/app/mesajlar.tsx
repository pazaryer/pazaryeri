import { Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { WebMessagesPage } from '@/components/web/WebMessagesPage';

export default function MesajlarScreen() {
  if (Platform.OS !== 'web') return <Redirect href="/(tabs)/messages" />;
  return <WebMessagesPage />;
}
