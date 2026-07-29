import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui';

export default function Index() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) return <Loading />;
  if (!user || !profile) return <Redirect href="/login" />;
  return <Redirect href="/(tabs)" />;
}
