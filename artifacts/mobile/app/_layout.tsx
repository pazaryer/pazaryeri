import React, { useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import { Platform } from 'react-native';
import '@/styles/web-global.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
import { isOnboardingComplete } from '@/lib/onboarding';

try {
  initApi();
  initFirebase();
} catch (err) {
  console.error('[Pazaryeri] Başlatma hatası:', err);
}
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
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(Platform.OS === 'web' ? true : null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    isOnboardingComplete().then(setOnboardingDone);
  }, []);

  useEffect(() => {
    if (isLoading || onboardingDone === null) return;

    const isWeb = Platform.OS === 'web';
    const seg = segments[0];
    const segName = segments[0] as string | undefined;
    const inOnboarding = segName === 'onboarding';
    const inAuth =
      segName === 'login' ||
      segName === 'email-auth' ||
      segName === 'oauth' ||
      segName === 'giris' ||
      segName === 'kayit' ||
      inOnboarding;
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

    const isMobileOAuthBridge =
      isWeb && segments[0] === 'oauth' && segments[1] === 'mobile';

    // Mobil köprü: tarayıcıda giriş sonrası web ana sayfasına gitme — uygulamaya dön
    if (isMobileOAuthBridge) {
      return;
    }

    if (isWeb && seg === '(tabs)') {
      router.replace('/kesfet');
      return;
    }

    if (isWeb && seg === 'login') {
      router.replace('/giris');
      return;
    }

    if (!isWeb && !onboardingDone && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }

    if (!user && !inAuth && !inLegal && !isPublicWeb) {
      router.replace(isWeb ? '/giris' : '/login');
    } else if (user && inAuth) {
      router.replace(isWeb ? '/' : '/(tabs)');
    }
  }, [user, isLoading, onboardingDone, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="index" />
      <Stack.Screen name="giris" />
      <Stack.Screen name="kayit" />
      <Stack.Screen name="kesfet" />
      <Stack.Screen name="ilan-ver" />
      <Stack.Screen name="ilan-duzenle/[id]" />
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
      <Stack.Screen name="settings" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="help" />
    </Stack>
  );
}

function KeyboardShell({ children }: { children: ReactNode }) {
  if (Platform.OS === 'web') return <>{children}</>;
  const { KeyboardProvider } = require('react-native-keyboard-controller');
  return <KeyboardProvider>{children}</KeyboardProvider>;
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

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const onError = (event: ErrorEvent) => {
        console.error('[Pazaryeri] Web hata:', event.error ?? event.message);
      };
      window.addEventListener('error', onError);
      return () => window.removeEventListener('error', onError);
    }
  }, []);

  const ready = fontsLoaded || fontError || fontTimeout;
  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardShell>
                <RootLayoutNav />
              </KeyboardShell>
            </GestureHandlerRootView>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
