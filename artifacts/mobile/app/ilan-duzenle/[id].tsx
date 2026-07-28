import { Platform } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { WebPostPage } from '@/components/web/WebPostPage';
import EditListingMobileScreen from '@/components/EditListingMobileScreen';

export default function IlanDuzenleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) return <Redirect href="/hesabim" />;

  if (Platform.OS === 'web') {
    return <WebPostPage editId={id} />;
  }

  return <EditListingMobileScreen listingId={id} />;
}
