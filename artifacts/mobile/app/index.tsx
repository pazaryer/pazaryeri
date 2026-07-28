import { Platform } from 'react-native';
import { WebHomePage } from '@/components/web/WebHomePage';

export default function Index() {
  if (Platform.OS === 'web') {
    return <WebHomePage />;
  }
  // Mobil: yönlendirme _layout.tsx içinde yapılır (çift redirect döngüsünü önler)
  return null;
}
