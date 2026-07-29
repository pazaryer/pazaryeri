import React, { useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
if (Platform.OS === 'web') {
  require('@/styles/web-global.css');
}
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
import { MobileLocationProvider } from '@/contexts/MobileLocationContext';
import { BootScreen } from '@/components/BootScreen';
import { useGoogleOAuthLinkHandler } from '@/lib/google-native-auth';
import { initApi } from '@/lib/api';
import { initFirebase } from '@/lib/firebase';
import { isOnboardingComplete, isOnboardingDoneSync, subscribeOnboarding } from '@/lib/onboarding';

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

function segmentKey(segments: string[]): string {
  return segments.length ? segments.join('/') : 'root';
}

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  useGoogleOAuthLinkHandler();
  const [onboardingDone, setOnboardingDone] = useState(true);
  const lastNavTarget = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void isOnboardingComplete().then(setOnboardingDone);
    return subscribeOnboarding(setOnboardingDone);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const isWeb = Platform.OS === 'web';
    const segName = segments[0] as string | undefined;
    const current = segmentKey(segments as string[]);
    const inOnboarding = segName === 'onboarding';
    const inAuth =
      inOnboarding ||
      segName === 'login' ||
      segName === 'auth' ||
      segName === 'email-auth' ||
      segName === 'oauth' ||
      segName === 'giris' ||
      segName === 'kayit';
    const inLegal = segName === 'privacy' || segName === 'terms';
    const isPublicWeb =
      isWeb &&
      (!segName ||
        segName === 'index' ||
        segName === 'kesfet' ||
        segName === 'listing' ||
        segName === 'giris' ||
        segName === 'kayit' ||
        inLegal);

    if (isWeb && segments[0] === 'oauth' && segments[1] === 'mobile') return;

    let target: string | null = null;

    if (isWeb && segName === '(tabs)') {
      target = '/kesfet';
    } else if (isWeb && segName === 'login') {
      target = '/giris';
    } else if (!isWeb && !onboardingDone && !isOnboardingDoneSync() && !inOnboarding) {
      target = '/onboarding';
    } else if (!user && !inAuth && !inLegal && !isPublicWeb) {
      target = isWeb ? '/giris' : '/login';
    } else if (user && (segName === 'login' || segName === 'email-auth' || segName === 'auth' || segName === 'giris' || segName === 'kayit')) {
      target = isWeb ? '/' : '/(tabs)';
    }

    if (!target) {
      lastNavTarget.current = null;
      return;
    }

    const targetKey = target.replace(/^\//, '');
    if (current === targetKey || current.startsWith(`${targetKey}/`)) {
      return;
    }
    if (lastNavTarget.current === target) return;

    lastNavTarget.current = target;
    router.replace(target as never);
  }, [user, isLoading, onboardingDone, segments, router]);

  return (
    <>
      {Platform.OS !== 'web' ? <StatusBar style="dark" /> : null}
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
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="email-auth" />
      <Stack.Screen name="oauth/google" />
      <Stack.Screen name="oauth/app-return" options={{ headerShown: false }} />
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
    </>
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
  const [fontTimeout, setFontTimeout] = useState(Platform.OS !== 'web');
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
  if (!ready) return <BootScreen />;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardShell>
                {Platform.OS === 'web' ? (
                  <RootLayoutNav />
                ) : (
                  <MobileLocationProvider>
                    <RootLayoutNav />
                  </MobileLocationProvider>
                )}
              </KeyboardShell>
            </GestureHandlerRootView>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
