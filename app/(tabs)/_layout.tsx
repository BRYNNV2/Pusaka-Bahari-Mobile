import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f0ee',
          height: Platform.OS === 'ios' ? 92 : 72,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
          paddingHorizontal: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: '#3c2415',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Beranda',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={focused ? "home" : "home-outline"} size={20} color={focused ? '#c8956c' : color} />
            </View>
          ),
        }} 
      />
      <Tabs.Screen 
        name="map" 
        options={{ 
          title: 'Peta',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={focused ? "map" : "map-outline"} size={20} color={focused ? '#c8956c' : color} />
            </View>
          ),
        }} 
      />
      <Tabs.Screen 
        name="gallery" 
        options={{ 
          title: 'Galeri',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={focused ? "images" : "images-outline"} size={20} color={focused ? '#c8956c' : color} />
            </View>
          ),
        }} 
      />
      <Tabs.Screen 
        name="catalog" 
        options={{ 
          title: 'Katalog',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={focused ? "apps" : "apps-outline"} size={20} color={focused ? '#c8956c' : color} />
            </View>
          ),
        }} 
      />
      <Tabs.Screen 
        name="books" 
        options={{ 
          title: 'Buku',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={focused ? "library" : "library-outline"} size={20} color={focused ? '#c8956c' : color} />
            </View>
          ),
        }} 
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#3c2415',
  },
});
