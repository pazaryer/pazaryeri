import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { ANNOUNCEMENTS } from '@/lib/categories';

const MARQUEE_TEXT = ANNOUNCEMENTS.join('   •   ') + '   •   ';

function MarqueeContent() {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.track}>
        {/* Web: CSS marquee — sorunsuz, kesintisiz animasyon */}
        {/* @ts-expect-error web only */}
        <div className="pz-marquee-track">
          <span className="pz-marquee-item">{MARQUEE_TEXT}</span>
          <span className="pz-marquee-item" aria-hidden="true">
            {MARQUEE_TEXT}
          </span>
        </div>
      </View>
    );
  }

  return (
    <View style={styles.track}>
      <Text style={styles.marqueeText} numberOfLines={1}>
        {MARQUEE_TEXT}
      </Text>
    </View>
  );
}

export function WebAnnouncementBanner() {
  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>DUYURU</Text>
      </View>
      <MarqueeContent />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: '#2A1260',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.3)',
    height: 38,
  },
  badge: {
    backgroundColor: '#C9A84C',
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
    zIndex: 2,
    flexShrink: 0,
  },
  badgeText: {
    color: '#1A0A2E',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  track: {
    flex: 1,
    overflow: 'hidden',
    height: '100%',
    justifyContent: 'center',
  },
  marqueeText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    fontWeight: '600',
  },
});
