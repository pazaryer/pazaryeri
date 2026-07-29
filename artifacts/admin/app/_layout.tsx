import { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppSplash } from '@/components/AppSplash';
import { AdminPushNotificationHandler } from '@/components/AdminPushNotificationHandler';
import { AdminNotificationWatcher } from '@/components/AdminNotificationWatcher';
import { THEME } from '@/lib/theme';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 15_000 } },
});

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <AppSplash onReady={() => setSplashDone(true)} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="light" />
            <AdminPushNotificationHandler />
            <AdminNotificationWatcher />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: THEME.bg },
                headerTintColor: THEME.text,
                headerTitleStyle: { fontWeight: '700' },
                contentStyle: { backgroundColor: THEME.bg },
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="listing/[id]" options={{ headerShown: false }} />
            </Stack>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
