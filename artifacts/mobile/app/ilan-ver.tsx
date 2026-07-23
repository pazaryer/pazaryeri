import { Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { WebPostPage } from '@/components/web/WebPostPage';

export default function IlanVerScreen() {
  if (Platform.OS !== 'web') return <Redirect href="/(tabs)/post" />;
  return <WebPostPage />;
}
