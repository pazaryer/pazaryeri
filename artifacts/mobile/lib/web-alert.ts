import { Alert, Platform } from 'react-native';

export function showAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
): void {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      void onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: 'İptal', style: 'cancel' },
    { text: 'Tamam', onPress: () => void onConfirm() },
  ]);
}
