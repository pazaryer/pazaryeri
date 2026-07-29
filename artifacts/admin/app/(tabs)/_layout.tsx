import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui';
import { THEME } from '@/lib/theme';

export default function TabsLayout() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) return <Loading />;
  if (!user || !profile) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: THEME.bg },
        headerTintColor: THEME.text,
        tabBarStyle: {
          backgroundColor: THEME.surface,
          borderTopColor: THEME.border,
          height: 62,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: THEME.gold,
        tabBarInactiveTintColor: THEME.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Panel',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Kullanıcılar',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="listings"
        options={{
          title: 'İlanlar',
          tabBarIcon: ({ color, size }) => <Ionicons name="pricetags-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="comments"
        options={{
          title: 'Yorumlar',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Şikayetler',
          tabBarIcon: ({ color, size }) => <Ionicons name="flag-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="marquee"
        options={{
          title: 'Kayan',
          tabBarIcon: ({ color, size }) => <Ionicons name="text-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="config"
        options={{
          title: 'CMS',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="audit"
        options={{
          title: 'Kayıt',
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
