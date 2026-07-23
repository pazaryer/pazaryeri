import { Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { WebProfilePage } from '@/components/web/WebProfilePage';

export default function HesabimScreen() {
  if (Platform.OS !== 'web') return <Redirect href="/(tabs)/profile" />;
  return <WebProfilePage />;
}
