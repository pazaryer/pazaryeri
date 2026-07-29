import React, { useMemo } from 'react';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND } from '@/constants/brand';
import { useCompactScreen } from '@/hooks/useCompactScreen';
import { MobileLocationPicker } from '@/components/MobileLocationPicker';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/lib/hooks';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const compact = useCompactScreen();
  const { user } = useAuth();
  const { data: convoData } = useConversations(!!user);
  const tabBarHeight = (compact ? 54 : 58) + insets.bottom;
  const iconSize = compact ? 22 : 24;

  const unreadMessages = useMemo(
    () => (convoData?.items ?? []).reduce((sum, item) => sum + item.unreadCount, 0),
    [convoData?.items],
  );

  const screenOptions = useMemo(
    () => ({
      tabBarActiveTintColor: BRAND.primary,
      tabBarInactiveTintColor: '#9E9E9E',
      headerShown: false,
      tabBarShowLabel: true,
      tabBarLabelStyle: {
        fontSize: compact ? 10 : 11,
        fontWeight: '600' as const,
        marginBottom: Platform.OS === 'android' ? 6 : 4,
      },
      tabBarIconStyle: { marginTop: 4 },
      tabBarStyle: {
        position: 'absolute' as const,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8',
        elevation: 8,
        height: tabBarHeight,
        paddingBottom: insets.bottom,
      },
    }),
    [compact, tabBarHeight, insets.bottom],
  );

  return (
    <>
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'İlan Ver',
          tabBarIcon: () => (
            <View
              style={{
                width: compact ? 30 : 32,
                height: compact ? 30 : 32,
                borderRadius: compact ? 15 : 16,
                backgroundColor: BRAND.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="add" size={compact ? 20 : 22} color="#FFF" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mesajlar',
          tabBarBadge: unreadMessages > 0 ? (unreadMessages > 99 ? '99+' : unreadMessages) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: BRAND.primary,
            fontSize: 10,
            fontWeight: '700',
            minWidth: 18,
            height: 18,
            lineHeight: 18,
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={iconSize} color={color} />
          ),
        }}
      />
    </Tabs>
    {Platform.OS !== 'web' && <MobileLocationPicker />}
    </>
  );
}
