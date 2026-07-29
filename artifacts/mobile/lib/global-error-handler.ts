import { Platform } from 'react-native';

/** Yakalanmamış hataları logla; uygulamanın aniden kapanmasını azaltır. */
export function installGlobalErrorHandlers(): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('[Pazaryeri] İşlenmemiş promise hatası:', event.reason);
    });
    return;
  }

  const errorUtils = (global as {
    ErrorUtils?: {
      setGlobalHandler?: (fn: (err: Error, fatal?: boolean) => void) => void;
      getGlobalHandler?: () => (err: Error, fatal?: boolean) => void;
    };
  }).ErrorUtils;
  if (!errorUtils?.setGlobalHandler) return;

  const prev = errorUtils.getGlobalHandler?.();
  errorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    console.error('[Pazaryeri] Global hata:', error?.message, isFatal ? '(fatal)' : '');
    if (typeof prev === 'function') prev(error, isFatal);
  });
}
