import React from 'react';
import { Platform, StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCompactScreen } from '@/hooks/useCompactScreen';

function CustomPostTabButton({ onPress }: { onPress?: () => void }) {
  const compact = useCompactScreen();
  const size = compact ? 52 : 58;
  const lift = compact ? 14 : 18;

  return (
    <Pressable
      style={{ ...StyleSheet.absoluteFillObject, top: -lift, justifyContent: 'center', alignItems: 'center' }}
      onPress={onPress}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FF3B30',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#FF3B30',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Ionicons name="camera" size={compact ? 24 : 26} color="#FFF" />
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const compact = useCompactScreen();
  const tabBarHeight = (compact ? 54 : 58) + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF3B30',
        tabBarInactiveTintColor: '#9E9E9E',
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: compact ? 10 : 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'android' ? 6 : 4,
        },
        tabBarIconStyle: { marginTop: 4 },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E8E8E8',
          elevation: 8,
          height: tabBarHeight,
          paddingBottom: insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={compact ? 22 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={compact ? 22 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Sat',
          tabBarIcon: () => null,
          tabBarLabel: () => null,
          tabBarButton: (props) => <CustomPostTabButton onPress={props.onPress} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mesajlar',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={compact ? 22 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={compact ? 22 : 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
