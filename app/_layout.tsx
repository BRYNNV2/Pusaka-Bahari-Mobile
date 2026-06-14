import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import CustomToast from '@/components/CustomToast';

export const unstable_settings = {
  initialRouteName: 'index',
};

function RootLayoutNav() {
  const { isDark, colors } = useTheme();

  const CustomDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  const CustomLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={isDark ? CustomDarkTheme : CustomLightTheme}>
      <Stack screenOptions={{ 
        headerShown: false, 
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
        detachPreviousScreen: false
      } as any}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="profile" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="artifact/[id]" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent backgroundColor="transparent" />
      <CustomToast />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AppThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </AppThemeProvider>
    </LanguageProvider>
  );
}

