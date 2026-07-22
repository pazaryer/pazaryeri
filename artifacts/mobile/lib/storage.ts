import { apiFetch } from './api';

export async function pickImages(max = 10): Promise<string[]> {
  const ImagePicker = await import('expo-image-picker');
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Galeri izni gerekli');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: max,
    quality: 0.8,
  });

  if (result.canceled || !result.assets.length) return [];

  const urls: string[] = [];
  for (const asset of result.assets) {
    const url = await uploadImage(asset.uri);
    if (url) urls.push(url);
  }
  return urls;
}

export async function takePhoto(): Promise<string | null> {
  const ImagePicker = await import('expo-image-picker');
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Kamera izni gerekli');
  }

  const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
  if (result.canceled || !result.assets[0]) return null;
  return uploadImage(result.assets[0].uri);
}

async function uploadImage(uri: string): Promise<string> {
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  const { uploadUrl, publicUrl } = await apiFetch<{
    uploadUrl: string;
    publicUrl: string;
  }>('/upload/presign', {
    method: 'POST',
    body: JSON.stringify({ contentType }),
  });

  const response = await fetch(uri);
  const blob = await response.blob();

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': contentType },
  });

  if (!uploadRes.ok) {
    throw new Error('Fotoğraf yüklenemedi');
  }

  return publicUrl;
}
