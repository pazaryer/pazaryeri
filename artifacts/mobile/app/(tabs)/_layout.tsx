import React from 'react';
import { Platform, StyleSheet, useColorScheme, View, Pressable } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCompactScreen } from '@/hooks/useCompactScreen';

function CustomPostTabButton({ children, onPress }: any) {
  const colors = useColors();
  const compact = useCompactScreen();
  const size = compact ? 50 : 56;
  const lift = compact ? 16 : 20;

  return (
    <Pressable
      style={{
        ...StyleSheet.absoluteFillObject,
        top: -lift,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      onPress={onPress}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <Ionicons name="add" size={compact ? 28 : 32} color="#FFF" />
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const isAndroid = Platform.OS === 'android';
  const insets = useSafeAreaInsets();
  const compact = useCompactScreen();
  const tabBarHeight = (isAndroid ? (compact ? 58 : 64) : compact ? 52 : 56) + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: compact ? 10 : 11,
          fontWeight: '600',
          marginBottom: isAndroid ? (compact ? 4 : 6) : compact ? 3 : 4,
        },
        tabBarIconStyle: { marginTop: compact ? 4 : 6 },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: isWeb || isAndroid ? 1 : 0,
          borderTopColor: colors.border,
          elevation: isAndroid ? 8 : 0,
          height: tabBarHeight,
          paddingBottom: insets.bottom,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={compact ? 20 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'compass' : 'compass-outline'}
              size={compact ? 20 : 22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'İlan Ver',
          tabBarIcon: () => null,
          tabBarLabel: () => null,
          tabBarButton: (props) => <CustomPostTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mesajlar',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'chatbubble' : 'chatbubble-outline'}
              size={compact ? 20 : 22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={compact ? 20 : 22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
