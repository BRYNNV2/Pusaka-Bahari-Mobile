import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const CustomTabs = Tabs as any;

  return (
    <CustomTabs
      sceneContainerStyle={{ backgroundColor: colors.background }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 92 : 72,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
          paddingHorizontal: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
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
          title: t('tabHome'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : '#fdf4eb' }]}>
              <Ionicons name={focused ? "home" : "home-outline"} size={20} color={focused ? colors.primary : color} />
            </View>
          ),
        }} 
      />
      <Tabs.Screen 
        name="map" 
        options={{ 
          title: t('tabMap'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : '#fdf4eb' }]}>
              <Ionicons name={focused ? "map" : "map-outline"} size={20} color={focused ? colors.primary : color} />
            </View>
          ),
        }} 
      />
      <Tabs.Screen 
        name="gallery" 
        options={{ 
          title: t('tabGallery'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : '#fdf4eb' }]}>
              <Ionicons name={focused ? "images" : "images-outline"} size={20} color={focused ? colors.primary : color} />
            </View>
          ),
        }} 
      />
      <Tabs.Screen 
        name="catalog" 
        options={{ 
          title: t('tabCatalog'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : '#fdf4eb' }]}>
              <Ionicons name={focused ? "apps" : "apps-outline"} size={20} color={focused ? colors.primary : color} />
            </View>
          ),
        }} 
      />
      <Tabs.Screen 
        name="books" 
        options={{ 
          title: t('tabBooks'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : '#fdf4eb' }]}>
              <Ionicons name={focused ? "library" : "library-outline"} size={20} color={focused ? colors.primary : color} />
            </View>
          ),
        }} 
      />
    </CustomTabs>
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
});
