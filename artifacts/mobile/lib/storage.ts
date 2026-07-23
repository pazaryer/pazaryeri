import { Platform } from 'react-native';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { apiFetch } from './api';
import { getFirebaseAuth, getFirebaseStorage } from './firebase';

function guessContentType(uri: string): string {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
  };
  return map[ext ?? ''] ?? 'image/jpeg';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] ?? result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Fotoğraf okunamadı'));
    reader.readAsDataURL(blob);
  });
}

/** Web: resmi küçült + sıkıştır (maliyet ve hız için) */
async function compressImageFile(file: File): Promise<{ blob: Blob; contentType: string }> {
  if (typeof document === 'undefined') {
    return { blob: file, contentType: file.type || 'image/jpeg' };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxW = 1600;
      const scale = Math.min(1, maxW / img.width);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ blob: file, contentType: file.type || 'image/jpeg' });
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve({ blob, contentType: 'image/jpeg' });
          else resolve({ blob: file, contentType: file.type || 'image/jpeg' });
        },
        'image/jpeg',
        0.82,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Fotoğraf işlenemedi'));
    };
    img.src = objectUrl;
  });
}

async function uploadToFirebase(blob: Blob, contentType: string): Promise<string> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new Error('Fotoğraf yüklemek için giriş yapın');
  }

  const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const path = `listings/${user.uid}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const storageRef = ref(getFirebaseStorage(), path);
  await uploadBytes(storageRef, blob, { contentType });
  return getDownloadURL(storageRef);
}

async function uploadViaApi(blob: Blob, contentType: string): Promise<string> {
  const data = await blobToBase64(blob);
  const { publicUrl } = await apiFetch<{ publicUrl: string }>('/upload/image', {
    method: 'POST',
    body: JSON.stringify({ contentType, data }),
  });
  return publicUrl;
}

async function uploadImageBlob(blob: Blob, contentType: string): Promise<string> {
  if (!getFirebaseAuth().currentUser) {
    throw new Error('Fotoğraf yüklemek için giriş yapın');
  }

  try {
    return await uploadViaApi(blob, contentType);
  } catch (apiErr) {
    const apiMsg = apiErr instanceof Error ? apiErr.message : '';
    const retryWithFirebase =
      apiMsg.includes('404') ||
      apiMsg.includes('Failed to fetch') ||
      apiMsg.includes('Network request failed');

    if (!retryWithFirebase) {
      throw apiErr;
    }

    try {
      return await uploadToFirebase(blob, contentType);
    } catch (firebaseErr) {
      const fbMsg =
        firebaseErr instanceof Error ? firebaseErr.message : 'Firebase yükleme hatası';
      throw new Error(`Fotoğraf yüklenemedi. ${apiMsg} / ${fbMsg}`);
    }
  }
}

async function uploadImageNative(uri: string): Promise<string> {
  const contentType = guessContentType(uri);
  const response = await fetch(uri);
  const blob = await response.blob();
  return uploadImageBlob(blob, contentType);
}

async function uploadImageWeb(file: File): Promise<string> {
  const { blob, contentType } = await compressImageFile(file);
  return uploadImageBlob(blob, contentType);
}

function pickImagesWeb(max: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/heic,image/*';
    input.multiple = max > 1;
    input.style.display = 'none';
    document.body.appendChild(input);

    const cleanup = () => {
      if (input.parentNode) input.parentNode.removeChild(input);
    };

    input.onchange = async () => {
      const files = Array.from(input.files ?? []).slice(0, max);
      cleanup();
      if (files.length === 0) {
        resolve([]);
        return;
      }
      try {
        const urls: string[] = [];
        for (const file of files) {
          const url = await uploadImageWeb(file);
          urls.push(url);
        }
        resolve(urls);
      } catch (e) {
        reject(e);
      }
    };

    input.addEventListener('cancel', () => {
      cleanup();
      resolve([]);
    });

    input.click();
  });
}

export async function pickImages(max = 10): Promise<string[]> {
  if (Platform.OS === 'web') {
    return pickImagesWeb(max);
  }

  const ImagePicker = await import('expo-image-picker');
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Galeri izni gerekli');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: max,
    quality: 0.7,
  });

  if (result.canceled || !result.assets.length) return [];

  const urls: string[] = [];
  for (const asset of result.assets) {
    const url = await uploadImageNative(asset.uri);
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

  const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
  if (result.canceled || !result.assets[0]) return null;
  return uploadImageNative(result.assets[0].uri);
}
