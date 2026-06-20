import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';

export default function Index() {
  const { isLoggedIn, loading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_seen').then((val) => {
      setHasSeenOnboarding(val === 'true');
    });
  }, []);

  if (loading || hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
        <LottieView
          source={require('../assets/animations/Free Searching Animation.json')}
          autoPlay
          loop
          style={{ width: 180, height: 180 }}
        />
      </View>
    );
  }

  // Jika sudah login, langsung ke halaman utama (tabs)
  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  // Jika belum login tapi sudah lihat slider, ke halaman login
  if (hasSeenOnboarding) {
    return <Redirect href="/login" />;
  }

  // Jika belum pernah lihat slider, maka tampilkan
  return <Redirect href="/onboarding" />;
}
