import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    image: require('../assets/images/pusaka_bahari_banner_1776493187345.png'),
    badge: '🏛️',
    title: 'Warisan\nRaja Ali Haji',
    subtitle: 'Jelajahi kekayaan peninggalan intelektual dan budaya dari ulama besar Kepulauan Riau',
    accent: '#0f172a',
  },
  {
    id: 2,
    image: require('../assets/images/naskah_gurindam_1776493215711.png'),
    badge: '📜',
    title: 'Naskah &\nArtefak Bersejarah',
    subtitle: 'Temukan Gurindam Dua Belas, Tuhfat al-Nafis, dan ratusan catatan berharga yang terdigitalisasi',
    accent: '#0f172a',
  },
  {
    id: 3,
    image: require('../assets/images/masjid_penyengat_1776493242751.png'),
    badge: '🗺️',
    title: 'Situs &\nLokasi Sejarah',
    subtitle: 'Navigasi ke situs-situs bersejarah Pulau Penyengat langsung dari genggaman tangan Anda',
    accent: '#0f172a',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);



  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(idx);
  };

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('onboarding_seen', 'true');
    router.replace('/login');
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Slide ScrollView */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, index) => (
          <View key={slide.id} style={styles.slide}>
            {/* Background Image */}
            <Image source={slide.image} style={styles.bgImage} resizeMode="cover" />

            {/* Gradient overlay bottom */}
            <LinearGradient
              colors={['transparent', 'rgba(8,14,26,0.55)', 'rgba(8,14,26,0.97)']}
              locations={[0.3, 0.6, 1]}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Logo / Badge Floating */}
            <SafeAreaView edges={['top']} style={styles.topArea}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeIcon}>{slide.badge}</Text>
              </View>
              <Text style={styles.appName}>PUSAKA BAHARI</Text>
            </SafeAreaView>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        {/* Dot Indicators */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => scrollRef.current?.scrollTo({ x: i * width, animated: true })}
            >
              <View style={[styles.dot, i === activeIndex && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Title */}
        <Text style={styles.title}>{SLIDES[activeIndex].title}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{SLIDES[activeIndex].subtitle}</Text>

        {/* Buttons */}
        {isLast ? (
          <View style={styles.btnGroup}>
            <TouchableOpacity
              style={styles.loginBtn}
              activeOpacity={0.85}
              onPress={() => finishOnboarding()}
            >
              <Text style={styles.loginBtnText}>Masuk Akun</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.guestBtn}
              activeOpacity={0.75}
              onPress={async () => {
                await AsyncStorage.setItem('onboarding_seen', 'true');
                router.replace('/(tabs)');
              }}
            >
              <Text style={styles.guestBtnText}>Jelajahi sebagai Tamu</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.btnGroup}>
            <TouchableOpacity style={styles.loginBtn} activeOpacity={0.85} onPress={goNext}>
              <Text style={styles.loginBtnText}>Lanjut</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} activeOpacity={0.7} onPress={finishOnboarding}>
              <Text style={styles.skipBtnText}>Lewati</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#080e1a' },

  // Slide
  slide:      { width, height, position: 'relative' },
  bgImage:    { width: '100%', height: '100%', position: 'absolute' },

  // Top Logo
  topArea:    { alignItems: 'center', marginTop: 24, gap: 10 },
  logoBadge:  {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  logoBadgeIcon: { fontSize: 32 },
  appName:    { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 3 },

  // Bottom Card
  bottomCard: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 28, paddingTop: 28, paddingBottom: 40,
    minHeight: height * 0.42,
  },

  // Dots
  dotsRow:   { flexDirection: 'row', gap: 6, marginBottom: 20 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e2e8f0' },
  dotActive: { width: 24, backgroundColor: '#0f172a' },

  // Text
  title:    { fontSize: 30, fontWeight: '800', color: '#0f172a', lineHeight: 36, letterSpacing: -0.8, marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#64748b', lineHeight: 23, marginBottom: 32 },

  // Buttons
  btnGroup:      { gap: 12 },
  loginBtn:      { backgroundColor: '#0f172a', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  loginBtnText:  { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  guestBtn:      { height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  guestBtnText:  { color: '#475569', fontSize: 15, fontWeight: '600' },
  skipBtn:       { height: 48, alignItems: 'center', justifyContent: 'center' },
  skipBtnText:   { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
});
