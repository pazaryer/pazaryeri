import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
  Text,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listingGalleryImageProps } from '@/lib/listing-image-props';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageGalleryModalProps {
  images: string[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

export function ImageGalleryModal({ images, initialIndex = 0, visible, onClose }: ImageGalleryModalProps) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);
  const scrollRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ x: initialIndex * SCREEN_WIDTH, animated: false });
      });
      images.slice(0, 6).forEach((uri) => Image.prefetch(uri));
    }
  }, [visible, initialIndex, images]);

  if (!visible || images.length === 0) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <View style={styles.backdrop}>
        <Pressable style={[styles.closeBtn, { top: insets.top + 12 }]} onPress={onClose} hitSlop={16}>
          <Ionicons name="close" size={28} color="#FFF" />
        </Pressable>

        <Text style={[styles.counter, { top: insets.top + 16 }]}>
          {index + 1} / {images.length}
        </Text>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
          }}
        >
          {images.map((uri, i) => (
            <View key={`${uri}-${i}`} style={styles.slide}>
              <Image
                source={{ uri }}
                style={styles.image}
                contentFit="contain"
                recyclingKey={`gallery-${i}`}
                {...listingGalleryImageProps}
              />
            </View>
          ))}
        </ScrollView>

        {images.length > 1 && (
          <View style={[styles.dots, { bottom: insets.bottom + 24 }]}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000' },
  closeBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    zIndex: 10,
  },
  slide: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  image: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.75 },
  dots: { position: 'absolute', flexDirection: 'row', alignSelf: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { backgroundColor: '#C9A84C', width: 20 },
});
