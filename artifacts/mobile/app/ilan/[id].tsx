import { Redirect, useLocalSearchParams } from 'expo-router';

/** Türkçe SEO URL: /ilan/{id} → /listing/{id} */
export default function IlanAliasScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id || typeof id !== 'string') {
    return <Redirect href="/kesfet" />;
  }
  return <Redirect href={`/listing/${id}`} />;
}
