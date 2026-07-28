import { Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { WebHomePage } from '@/components/web/WebHomePage';

export default function Index() {
  if (Platform.OS === 'web') {
    return <WebHomePage />;
  }
  return <Redirect href="/login" />;
}
