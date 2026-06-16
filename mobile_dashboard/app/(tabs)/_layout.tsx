import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerBackground: () => (
          <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
        ),
        headerTitleStyle: { color: '#1e293b', fontSize: 20, fontWeight: '700' },
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: 'transparent',
          height: 60,
        },
        tabBarBackground: () => (
            <BlurView tint="light" intensity={90} style={StyleSheet.absoluteFill} />
        ),
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#94a3b8',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bluetooth"
        options={{
          title: 'Bluetooth',
          tabBarIcon: ({ color }) => <Ionicons name="bluetooth-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Ionicons name="time-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <Ionicons name="bar-chart-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
