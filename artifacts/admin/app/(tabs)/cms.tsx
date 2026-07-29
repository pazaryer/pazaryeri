import { Redirect } from 'expo-router';

/** Eski CMS hub — Ayarlar sekmesine yönlendir. */
export default function CmsScreen() {
  return <Redirect href="/(tabs)/more" />;
}
