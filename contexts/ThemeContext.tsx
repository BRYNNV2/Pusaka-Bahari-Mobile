import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface Colors {
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  card: string;
  danger: string;
}

interface ThemeContextData {
  mode: ThemeMode;
  isDark: boolean;
  colors: Colors;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const lightColors: Colors = {
  background: '#ffffff',
  backgroundSecondary: '#f8fafc',
  text: '#0f172a',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  primary: '#8B5E3C',
  card: '#ffffff',
  danger: '#ef4444',
};

const darkColors: Colors = {
  background: '#0f172a', // Slate 900
  backgroundSecondary: '#1e293b', // Slate 800
  text: '#f8fafc', // Slate 50
  textSecondary: '#94a3b8', // Slate 400
  border: '#334155', // Slate 700
  primary: '#d4af37', // Gold for better contrast
  card: '#1e293b',
  danger: '#ef4444',
};

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Load saved theme mode from storage
    AsyncStorage.getItem('theme_mode').then((savedMode) => {
      if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
        setModeState(savedMode as ThemeMode);
      }
      setIsMounted(true);
    });
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem('theme_mode', newMode);
  };

  const isDark = mode === 'system' ? systemColorScheme === 'dark' : mode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  // Wait until storage is read so it doesn't flash the wrong theme
  if (!isMounted) return null;

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
