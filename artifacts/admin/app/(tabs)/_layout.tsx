import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui';
import { LuxuryTabBar } from '@/components/LuxuryTabBar';
import { THEME } from '@/lib/theme';

export default function TabsLayout() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) return <Loading />;
  if (!user || !profile) return <Redirect href="/login" />;

  return (
    <Tabs
      tabBar={(props) => <LuxuryTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: THEME.bg },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="users" />
      <Tabs.Screen name="listings" />
      <Tabs.Screen name="comments" />
      <Tabs.Screen name="more" />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="marquee" options={{ href: null }} />
      <Tabs.Screen name="config" options={{ href: null }} />
      <Tabs.Screen name="branding" options={{ href: null }} />
      <Tabs.Screen name="cms" options={{ href: null }} />
      <Tabs.Screen name="audit" options={{ href: null }} />
    </Tabs>
  );
}
