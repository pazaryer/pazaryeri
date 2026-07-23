import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import '@/styles/web-global.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { initApi } from '@/lib/api';
import { initFirebase } from '@/lib/firebase';

initApi();
initFirebase();
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Platform.OS === 'web' ? 300_000 : 60_000,
      retry: 1,
      refetchOnWindowFocus: Platform.OS !== 'web',
    },
  },
});

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const isWeb = Platform.OS === 'web';
    const seg = segments[0];
    const inAuth =
      seg === 'login' ||
      seg === 'email-auth' ||
      seg === 'oauth' ||
      seg === 'giris' ||
      seg === 'kayit';
    const inLegal = seg === 'privacy' || seg === 'terms';
    const isPublicWeb =
      isWeb &&
      (!seg ||
        seg === 'index' ||
        seg === 'kesfet' ||
        seg === 'listing' ||
        seg === 'giris' ||
        seg === 'kayit' ||
        inLegal);

    if (isWeb && seg === '(tabs)') {
      router.replace('/kesfet');
      return;
    }

    if (isWeb && seg === 'login') {
      router.replace('/giris');
      return;
    }

    if (!user && !inAuth && !inLegal && !isPublicWeb) {
      router.replace(isWeb ? '/giris' : '/login');
    } else if (user && inAuth) {
      router.replace(isWeb ? '/' : '/(tabs)');
    }
  }, [user, isLoading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="giris" />
      <Stack.Screen name="kayit" />
      <Stack.Screen name="kesfet" />
      <Stack.Screen name="ilan-ver" />
      <Stack.Screen name="hesabim" />
      <Stack.Screen name="mesajlar" />
      <Stack.Screen name="login" />
      <Stack.Screen name="email-auth" />
      <Stack.Screen name="oauth/google" />
      <Stack.Screen name="oauth/mobile" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="listing/[id]" />
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [fontTimeout, setFontTimeout] = useState(Platform.OS === 'web');
  const splashHidden = useRef(false);

  const hideSplash = useCallback(() => {
    if (splashHidden.current) return;
    splashHidden.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      hideSplash();
      return;
    }
    const t = setTimeout(() => {
      setFontTimeout(true);
      hideSplash();
    }, 1500);
    return () => clearTimeout(t);
  }, [fontsLoaded, fontError, hideSplash]);

  const ready = fontsLoaded || fontError || fontTimeout;
  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
