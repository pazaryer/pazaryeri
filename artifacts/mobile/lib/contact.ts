import { Alert, Linking, Platform } from 'react-native';

export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `90${digits.slice(1)}`;
  else if (!digits.startsWith('90') && digits.length === 10) digits = `90${digits}`;
  return digits;
}

export function formatPhoneDisplay(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('0')) {
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  }
  return phone;
}

export async function openPhoneCall(phone: string): Promise<void> {
  const url = `tel:${phone.replace(/\s/g, '')}`;
  const can = await Linking.canOpenURL(url);
  if (!can) {
    Alert.alert('Hata', 'Arama başlatılamadı');
    return;
  }
  await Linking.openURL(url);
}

export async function openWhatsApp(phone: string, message?: string): Promise<void> {
  const digits = normalizePhone(phone);
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  const appUrl = `whatsapp://send?phone=${digits}${message ? `&text=${encodeURIComponent(message)}` : ''}`;
  const webUrl = `https://wa.me/${digits}${text}`;

  if (Platform.OS !== 'web') {
    const canApp = await Linking.canOpenURL(appUrl);
    if (canApp) {
      await Linking.openURL(appUrl);
      return;
    }
  }
  await Linking.openURL(webUrl);
}

export function getListingContactPhone(listing: {
  contactPhone?: string | null;
  seller?: { phone?: string | null };
}): string | null {
  return listing.contactPhone?.trim() || listing.seller?.phone?.trim() || null;
}
