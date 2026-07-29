import React, { createElement } from 'react';
import { Platform, View, StyleSheet } from 'react-native';

type Props = { text: string; subtle?: boolean };

/** Web — gerçek HTML + CSS animasyonu (RN className çalışmıyor) */
export function WebMarquee({ text, subtle }: Props) {
  if (Platform.OS !== 'web') return null;

  const itemClass = subtle ? 'pz-marquee-item pz-marquee-item-subtle' : 'pz-marquee-item';

  return createElement(
    'div',
    { className: 'pz-marquee-outer' },
    createElement(
      'div',
      { className: 'pz-marquee-track' },
      createElement('span', { className: itemClass }, text),
      createElement('span', { className: itemClass }, text),
    ),
  );
}

/** Native — AnnouncementBanner içinde Reanimated kullanılır; bu sarmalayıcı yalnızca hizalama */
export function MarqueeSlot({ children }: { children: React.ReactNode }) {
  return <View style={styles.track}>{children}</View>;
}

const styles = StyleSheet.create({
  track: {
    flex: 1,
    overflow: 'hidden',
    height: '100%',
    justifyContent: 'center',
  },
});
