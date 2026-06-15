import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Platform, StatusBar, Animated, Dimensions, Easing, RefreshControl, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 280;

const HERO_IMAGES = [
  require('../../assets/images/pusaka_bahari_banner_1776493187345.jpg'),
  require('../../assets/images/masjid_penyengat_1776493242751.jpg'),
  require('../../assets/images/naskah_gurindam_1776493215711.jpg'),
];

export default function HomeScreen() {
  const { mode, isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { isLoggedIn, user, isAdmin } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // Hero carousel
  const heroScrollX = useRef(new Animated.Value(0)).current;
  const heroIndex = useRef(0);
  const heroScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      heroIndex.current = (heroIndex.current + 1) % HERO_IMAGES.length;
      heroScrollRef.current?.scrollTo({
        x: heroIndex.current * (SCREEN_WIDTH - 40),
        animated: true,
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const categories = ['Semua', 'Artefak', 'Naskah', 'Monumen', 'Benda'];
  const CATEGORY_ICONS: Record<string, { lib: 'feather' | 'material' | 'ionicons'; name: string } | null> = {
    Semua: null,
    Artefak: { lib: 'material', name: 'shape-outline' },
    Naskah: { lib: 'feather', name: 'feather' },
    Monumen: { lib: 'material', name: 'bank' },
    Benda: { lib: 'feather', name: 'box' },
  };
  const [activeCategory, setActiveCategory] = useState('Semua');

  const [artifactsData, setArtifactsData] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'a-z' | 'z-a'>('newest');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [agendaData, setAgendaData] = useState<any[]>([]);
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [showFloatingAgenda, setShowFloatingAgenda] = useState(false);
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const hasShownAgendaModal = useRef(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, { toValue: -8, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(floatingAnim, { toValue: 0, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
      ])
    ).start();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const uid = user?.id || 'guest';
      const userCreatedAt = user?.created_at || new Date().toISOString();
      const lastRead = await AsyncStorage.getItem(`lastNotifRead_${uid}`);
      
      const hiddenStr = await AsyncStorage.getItem(`hiddenNotifs_${uid}`);
      let hidden: number[] = hiddenStr ? JSON.parse(hiddenStr) : [];
      if (user?.user_metadata?.hiddenNotifs) {
        const dbHidden = user.user_metadata.hiddenNotifs;
        if (Array.isArray(dbHidden)) {
          hidden = Array.from(new Set([...hidden, ...dbHidden]));
        }
      }

      let query = supabase
        .from('notifications')
        .select('id, created_at')
        .gt('created_at', userCreatedAt);
        
      if (lastRead) {
        query = query.gt('created_at', lastRead);
      }
      
      const { data } = await query;
      const unread = (data || []).filter(n => !hidden.includes(n.id));
      setUnreadCount(unread.length);
    } catch (e) {
      setUnreadCount(0);
    }
  };

  const triggerWeatherAlertNotification = async (windSpeed: number, weatherCode: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastAlerted = await AsyncStorage.getItem('@last_weather_alert_date');
      if (lastAlerted === today) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: language === 'en' ? '⚠️ Extreme Weather Alert' : '⚠️ Peringatan Cuaca Buruk',
          body: language === 'en' 
            ? `High wind speeds (${windSpeed} km/h) or heavy rain detected. Crossing to Penyengat is NOT recommended.`
            : `Angin kencang (${windSpeed} km/h) atau hujan lebat terdeteksi. Jalur penyeberangan pompong TIDAK disarankan.`,
          data: { type: 'weather_alert' },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });

      await AsyncStorage.setItem('@last_weather_alert_date', today);
    } catch (e) {
      console.warn('Failed to send local notification:', e);
    }
  };

  const fetchWeather = async () => {
    try {
      setWeatherLoading(true);
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=0.9333&longitude=104.4333&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia/Jakarta');
      const data = await res.json();
      if (data && data.current) {
        const cur = data.current;
        const code = cur.weather_code;
        const temp = Math.round(cur.temperature_2m);
        const wind = cur.wind_speed_10m;
        const hum = cur.relative_humidity_2m;

        // Map weather code
        let status = 'Cerah';
        let wIcon = 'sunny-outline';
        if (code === 0) {
          status = language === 'en' ? 'Sunny' : 'Cerah';
          wIcon = 'sunny-outline';
        } else if (code >= 1 && code <= 3) {
          status = language === 'en' ? 'Partly Cloudy' : 'Berawan';
          wIcon = 'cloud-outline';
        } else if (code >= 51 && code <= 67) {
          status = language === 'en' ? 'Rain' : 'Hujan';
          wIcon = 'rainy-outline';
        } else if (code >= 80 && code <= 82) {
          status = language === 'en' ? 'Showers' : 'Hujan Lebat';
          wIcon = 'rainy-outline';
        } else if (code >= 95) {
          status = language === 'en' ? 'Thunderstorm' : 'Badai Petir';
          wIcon = 'thunderstorm-outline';
        } else {
          status = language === 'en' ? 'Cloudy' : 'Mendung';
          wIcon = 'cloudy-outline';
        }

        // Map safety status
        let sStatus = language === 'en' ? 'Safe to Sail' : 'Aman Berlayar';
        let sDesc = language === 'en' ? 'Normal sea waves.' : 'Gelombang laut & angin normal.';
        let sColor = '#22c55e'; // Green

        if (wind > 20 || code >= 95 || code === 65 || code === 82) {
          sStatus = language === 'en' ? 'Danger: High Waves' : 'Bahaya: Angin Kencang';
          sDesc = language === 'en' ? 'Sailing not recommended.' : 'Tidak disarankan menyeberang.';
          sColor = '#ef4444'; // Red
          triggerWeatherAlertNotification(Math.round(wind), code);
        } else if (wind > 14) {
          sStatus = language === 'en' ? 'Caution Needed' : 'Harap Waspada';
          sDesc = language === 'en' ? 'Moderate wind, watch waves.' : 'Kecepatan angin sedang.';
          sColor = '#f59e0b'; // Orange
        }

        const weatherObj = {
          temp,
          windSpeed: Math.round(wind),
          humidity: hum,
          code,
          statusText: status,
          icon: wIcon,
          safetyStatus: sStatus,
          safetyDesc: sDesc,
          safetyColor: sColor,
        };

        setWeatherData(weatherObj);
        setIsOffline(false);
        await AsyncStorage.setItem('@weather_cache', JSON.stringify(weatherObj));
      }
    } catch (e) {
      console.warn('Weather fetch error, trying cache:', e);
      setIsOffline(true);
      try {
        const cachedWeather = await AsyncStorage.getItem('@weather_cache');
        if (cachedWeather) {
          setWeatherData(JSON.parse(cachedWeather));
        } else {
          // Static Fallback
          setWeatherData({
            temp: 29,
            windSpeed: 8,
            humidity: 78,
            code: 1,
            statusText: language === 'en' ? 'Partly Cloudy' : 'Berawan',
            icon: 'cloud-outline',
            safetyStatus: language === 'en' ? 'Safe to Sail' : 'Aman Berlayar',
            safetyDesc: language === 'en' ? 'Waves and winds normal.' : 'Kondisi angin & ombak aman.',
            safetyColor: '#22c55e',
          });
        }
      } catch (innerErr) {}
    } finally {
      setWeatherLoading(false);
    }
  };

  const getDayAndMonth = (dateString: string) => {
    if (!dateString) return { day: '-', month: '-' };
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const monthStr = date.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
      return { day, month: monthStr };
    } catch {
      return { day: '-', month: '-' };
    }
  };

  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    supabase.from('profiles').select('avatar_url').eq('id', user.id).single()
      .then(({ data }) => setAvatarUrl(data?.avatar_url ?? null));
  }, [user]);

  useEffect(() => {
    (async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Notification permission not granted');
      }
    })();
  }, []);

  const handleFilterPress = () => {
    setShowFilterDropdown(!showFilterDropdown);
  };

  useEffect(() => {
    fetchArtifacts();
  }, [activeCategory, sortOrder]);

  const fetchArtifacts = async () => {
    setLoadingContent(true);
    let query = supabase.from('artifacts').select('*');
    
    if (activeCategory !== 'Semua') {
      query = query.eq('type', activeCategory);
    }

    if (sortOrder === 'newest') query = query.order('id', { ascending: false });
    else if (sortOrder === 'oldest') query = query.order('id', { ascending: true });
    else if (sortOrder === 'a-z') query = query.order('name', { ascending: true });
    else if (sortOrder === 'z-a') query = query.order('name', { ascending: false });
    
    try {
      const { data, error } = await query;
      if (error) throw error;
      setArtifactsData(data || []);
      setIsOffline(false);
      const cacheKey = `@artifacts_cache_${activeCategory}_${sortOrder}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data || []));
    } catch (e) {
      console.log('Error fetching artifacts, trying cache:', e);
      setIsOffline(true);
      try {
        const cacheKey = `@artifacts_cache_${activeCategory}_${sortOrder}`;
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          setArtifactsData(JSON.parse(cachedData));
        } else {
          const generalCache = await AsyncStorage.getItem('@artifacts_cache_Semua_newest');
          if (generalCache) {
            const parsed = JSON.parse(generalCache);
            if (activeCategory !== 'Semua') {
              setArtifactsData(parsed.filter((item: any) => item.type === activeCategory));
            } else {
              setArtifactsData(parsed);
            }
          }
        }
      } catch (innerErr) {}
    } finally {
      setLoadingContent(false);
    }
  };

  const fetchAgendaFast = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data, error } = await supabase
        .from('agenda')
        .select('*')
        .gte('event_date', today) // Hanya ambil yang di masa depan/hari ini
        .order('event_date', { ascending: true })
        .limit(2);
      
      if (error) throw error;
      setAgendaData(data || []);
      await AsyncStorage.setItem('@agenda_cache', JSON.stringify(data || []));

      // Tampilkan popup jika ada agenda terdekat, dibatasi maksimal 1x sehari pakai AsyncStorage
      if (data && data.length > 0 && !hasShownAgendaModal.current) {
        const lastShownDate = await AsyncStorage.getItem('agenda_popup_date');
        if (lastShownDate !== today) {
          setShowAgendaModal(true);
          await AsyncStorage.setItem('agenda_popup_date', today);
        }
        hasShownAgendaModal.current = true;
      }
    } catch (e) {
      console.log('Error fetching agenda, trying cache:', e);
      try {
        const cached = await AsyncStorage.getItem('@agenda_cache');
        if (cached) {
          setAgendaData(JSON.parse(cached));
        }
      } catch (innerErr) {}
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAgendaFast();
      fetchUnreadCount();
      fetchWeather();
    }, [language])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchArtifacts(),
      fetchAgendaFast(),
      fetchWeather()
    ]);
    setRefreshing(false);
  }, [activeCategory, language]);

  const filteredArtifacts = artifactsData.filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView 
          bounces={true} 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        >
          
          {/* 1. Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.greetingGroup}>
              <Text style={styles.greetingTime}>
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 11) return t('morning');
                  if (hour < 15) return t('afternoon');
                  if (hour < 18) return t('evening');
                  return t('night');
                })()}
              </Text>
              <Text style={styles.greetingName} numberOfLines={1}>
                {isLoggedIn ? (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pengguna') : t('exploreHeritage')}
              </Text>
            </View>

            <View style={styles.headerRightActions}>
              <View style={{ position: 'relative', zIndex: 1010 }}>
                <TouchableOpacity 
                  style={styles.langBtn} 
                  onPress={() => setShowLangDropdown(!showLangDropdown)}
                  activeOpacity={0.8}
                >
                  <Feather name="globe" size={16} color={colors.text} />
                  <Text style={styles.langBtnText}>{language.toUpperCase()}</Text>
                  <Feather name={showLangDropdown ? "chevron-up" : "chevron-down"} size={12} color={colors.textSecondary} />
                </TouchableOpacity>

                {showLangDropdown && (
                  <View style={styles.langDropdown}>
                    <TouchableOpacity 
                      style={[styles.langDropdownItem, language === 'id' && styles.langDropdownItemActive]}
                      onPress={() => {
                        setLanguage('id');
                        setShowLangDropdown(false);
                      }}
                    >
                      <Text style={styles.langDropdownText}>🇮🇩  Indo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.langDropdownItem, language === 'en' && styles.langDropdownItemActive]}
                      onPress={() => {
                        setLanguage('en');
                        setShowLangDropdown(false);
                      }}
                    >
                      <Text style={styles.langDropdownText}>🇬🇧  Eng</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {isLoggedIn && (
                <TouchableOpacity style={styles.bellBtn} onPress={() => router.push('/notifications' as any)}>
                  <Feather name="bell" size={20} color={colors.text} />
                  {unreadCount > 0 && (
                    <View style={styles.bellBadge}>
                      <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.avatarBtn} 
                onPress={() => isLoggedIn ? router.push('/profile') : router.push('/login')}
                activeOpacity={0.8}
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Feather name="user" size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
 
          {/* Offline Mode Banner */}
          {isOffline && (
            <View style={styles.offlineBanner}>
              <Ionicons name="cloud-offline-outline" size={15} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.offlineBannerText}>
                {language === 'en' 
                  ? 'Offline Mode — Showing Cached Data' 
                  : 'Mode Offline — Menampilkan Data Kaca (Cache)'}
              </Text>
            </View>
          )}

          {/* 2. Hero Carousel */}
          <View style={styles.heroCard}>
            <Animated.ScrollView
              ref={heroScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: heroScrollX } } }],
                { useNativeDriver: true }
              )}
              onMomentumScrollEnd={(e) => {
                heroIndex.current = Math.round(
                  e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 40)
                );
              }}
              style={StyleSheet.absoluteFillObject}
            >
              {HERO_IMAGES.map((img, i) => (
                <Image
                  key={i}
                  source={img}
                  style={{
                    width: SCREEN_WIDTH - 40,
                    height: HERO_HEIGHT,
                  }}
                  resizeMode="cover"
                />
              ))}
            </Animated.ScrollView>

            <LinearGradient
              colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.7)']}
              locations={[0, 1]}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />

            {/* Hero Content Overlay */}
            <View style={styles.heroOverlay}>
              <View style={styles.heroBadge}>
                <Ionicons name="compass" size={13} color={colors.background} />
                <Text style={styles.heroBadgeText}>{t('exploreNow')}</Text>
              </View>
              <Text style={styles.heroTitle}>{t('heroTitle')}</Text>
              <Text style={styles.heroSubtitle}>{t('heroSubtitle')}</Text>

              {/* Dot Indicators */}
              <View style={styles.heroDots}>
                {HERO_IMAGES.map((_, i) => {
                  const inputRange = [
                    (i - 1) * (SCREEN_WIDTH - 40),
                    i * (SCREEN_WIDTH - 40),
                    (i + 1) * (SCREEN_WIDTH - 40),
                  ];
                  const dotScale = heroScrollX.interpolate({
                    inputRange,
                    outputRange: [1, 1.4, 1],
                    extrapolate: 'clamp',
                  });
                  const dotOpacity = heroScrollX.interpolate({
                    inputRange,
                    outputRange: [0.4, 1, 0.4],
                    extrapolate: 'clamp',
                  });
                  return (
                    <Animated.View
                      key={i}
                      style={[
                        styles.heroDot,
                        {
                          transform: [{ scale: dotScale }],
                          opacity: dotOpacity,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </View>

          {/* 3. Search Bar */}
          <View style={[styles.searchContainer, { zIndex: 100, position: 'relative' }]}>
            <Feather name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder={t('searchPlaceholder')}
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity style={styles.filterBtn} onPress={() => setSearchQuery('')}>
                <Feather name="x" size={20} color={colors.danger} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.filterBtn} onPress={handleFilterPress}>
                <Ionicons name="options-outline" size={20} color={sortOrder !== 'newest' ? colors.primary : colors.text} />
              </TouchableOpacity>
            )}

            {/* Dropdown Filter */}
            {showFilterDropdown && (
              <View style={styles.dropdownMenuInline}>
                {(['newest', 'oldest', 'a-z', 'z-a'] as const).map(option => (
                  <TouchableOpacity 
                    key={option} 
                    style={[styles.dropdownItem, sortOrder === option && styles.dropdownItemActive]}
                    onPress={() => {
                      setSortOrder(option);
                      setShowFilterDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, sortOrder === option && styles.dropdownItemTextActive]}>
                      {option === 'newest' ? 'Terbaru' : option === 'oldest' ? 'Terlama' : option === 'a-z' ? 'Abjad (A-Z)' : 'Abjad (Z-A)'}
                    </Text>
                    {sortOrder === option && <Feather name="check" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* 🌤️ Weather & Sea Safety Widget */}
          <View style={styles.weatherCard}>
            <View style={styles.weatherHeader}>
              <View style={styles.weatherLocGroup}>
                <Ionicons name="boat-outline" size={16} color={colors.primary} />
                <Text style={styles.weatherLocTitle}>
                  {language === 'en' ? 'Weather & Crossing Info' : 'Info Cuaca & Penyeberangan'}
                </Text>
              </View>
              <Text style={styles.weatherLocSubtitle}>P. Penyengat</Text>
            </View>

            {weatherLoading ? (
              <View style={styles.weatherLoadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.weatherLoadingText}>
                  {language === 'en' ? 'Loading weather info...' : 'Memuat info cuaca...'}
                </Text>
              </View>
            ) : weatherData ? (
              <View style={styles.weatherMainContent}>
                {/* Left Side: Temp & Stats */}
                <View style={styles.weatherLeft}>
                  <View style={styles.tempRow}>
                    <Ionicons name={weatherData.icon as any} size={28} color={colors.primary} />
                    <Text style={styles.tempText}>{weatherData.temp}°C</Text>
                  </View>
                  <Text style={styles.weatherStatus}>{weatherData.statusText}</Text>
                  <Text style={styles.weatherDetailText}>
                    💨 {weatherData.windSpeed} km/h  •  💧 {weatherData.humidity}%
                  </Text>
                </View>

                {/* Right Side: Crossing Safety Indicator */}
                <View style={[styles.weatherRight, { borderColor: weatherData.safetyColor }]}>
                  <View style={[styles.safetyStatusIndicator, { backgroundColor: weatherData.safetyColor }]}>
                    <Ionicons 
                      name={weatherData.safetyColor === '#ef4444' ? 'alert-circle' : 'checkmark-circle'} 
                      size={12} 
                      color="#ffffff" 
                    />
                    <Text style={styles.safetyStatusText}>{weatherData.safetyStatus}</Text>
                  </View>
                  <Text style={styles.safetyDescText}>{weatherData.safetyDesc}</Text>
                </View>
              </View>
            ) : null}
          </View>



          {/* 4. Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
            {categories.map((item, index) => {
              const isActive = activeCategory === item;
              const iconConfig = CATEGORY_ICONS[item];
              const iconColor = isActive ? colors.background : colors.textSecondary;
              return (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                  onPress={() => setActiveCategory(item)}
                  activeOpacity={0.8}
                >
                  {iconConfig && (
                    iconConfig.lib === 'feather' ? (
                      <Feather name={iconConfig.name as any} size={14} color={iconColor} />
                    ) : iconConfig.lib === 'material' ? (
                      <MaterialCommunityIcons name={iconConfig.name as any} size={14} color={iconColor} />
                    ) : (
                      <Ionicons name={iconConfig.name as any} size={14} color={iconColor} />
                    )
                  )}
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 5. Content Grid */}
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>{t('exploreNearby')}</Text>

            <View style={[styles.gridContainer, { opacity: loadingContent ? 0.6 : 1 }]}>
              {loadingContent && filteredArtifacts.length === 0 ? (
                <View style={{ width: '100%', padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : filteredArtifacts.length === 0 ? (
                <View style={{ width: '100%', padding: 40, alignItems: 'center' }}>
                  <Feather name={searchQuery ? "search" : "inbox"} size={32} color={colors.textSecondary} style={{ marginBottom: 12 }} />
                  <Text style={{ color: colors.textSecondary, fontWeight: '500', textAlign: 'center' }}>
                    {searchQuery 
                      ? `Tidak ada hasil untuk "${searchQuery}"` 
                      : t('emptyData')}
                  </Text>
                </View>
              ) : filteredArtifacts.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.card} 
                  activeOpacity={0.9} 
                  onPress={() => router.push(`/artifact/${item.id}` as any)}
                >
                  <Image 
                    source={item.image_url ? { uri: item.image_url } : require('../../assets/images/naskah_gurindam_1776493215711.jpg')} 
                    style={styles.cardImage} 
                    resizeMode="cover" 
                  />
                  
                  <LinearGradient 
                    colors={['transparent', 'rgba(0,0,0,0.85)']} 
                    locations={[0.4, 1]}
                    style={StyleSheet.absoluteFillObject} 
                  />

                  <View style={styles.cardTopRow}>
                    <View style={styles.verifiedBadge}>
                      <MaterialCommunityIcons name="shield-check" size={14} color="#ffffff" />
                    </View>
                    <View style={styles.tagPill}>
                      <Text style={styles.tagText}>{item.type}</Text>
                    </View>
                  </View>

                  <View style={styles.cardBottom}>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={12} color="#fbbf24" />
                      <Text style={styles.ratingText}>5.0</Text>
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.cardLocationRow}>
                      <Ionicons name="time-outline" size={12} color="rgba(255, 255, 255, 0.7)" />
                      <Text style={styles.cardLocationText} numberOfLines={1}>{item.year || 'Abad 19'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* Full-Screen Poster Modal Agenda Mendatang */}
      <Modal
        visible={showAgendaModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowAgendaModal(false);
          setShowFloatingAgenda(true);
        }}
      >
        <View style={styles.modalOverlayPremium}>
          {agendaData.length > 0 && (
            <View style={styles.posterModalContainer}>
              {/* Poster Image - Full Area */}
              <View style={styles.posterImageWrap}>
                {agendaData[0].image_url ? (
                  <Image source={{ uri: agendaData[0].image_url }} style={styles.posterFullImage} resizeMode="cover" />
                ) : (
                  <LinearGradient colors={['#1e293b', colors.text]} style={styles.posterFullImage}>
                    <Ionicons name="calendar" size={64} color="rgba(255,255,255,0.15)" />
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 12, fontWeight: '600' }}>Poster belum tersedia</Text>
                  </LinearGradient>
                )}
                
                {/* Gradient Overlay (hanya di bagian atas dan bawah untuk readability) */}
                <LinearGradient 
                  colors={['rgba(0,0,0,0.5)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']} 
                  locations={[0, 0.2, 0.6, 1]}
                  style={StyleSheet.absoluteFillObject} 
                />

                {/* Close Button (kanan atas) */}
                <TouchableOpacity 
                  onPress={() => {
                    setShowAgendaModal(false);
                    setShowFloatingAgenda(true);
                  }} 
                  style={styles.posterCloseBtn}
                >
                  <Feather name="x" size={20} color="#ffffff" />
                </TouchableOpacity>

                {/* Badge Segera Hadir (kiri atas) */}
                <View style={styles.modalBadgeSegera}>
                  <Ionicons name="sparkles" size={14} color="#fbbf24" />
                  <Text style={styles.modalBadgeSegeraText}>SEGERA HADIR</Text>
                </View>

                {/* Info di Bawah Poster */}
                <View style={styles.posterBottomInfo}>
                  {agendaData[0].event_date && (
                    <View style={styles.posterDateBadge}>
                      <Feather name="calendar" size={12} color="#fbbf24" />
                      <Text style={styles.posterDateText}>
                        {new Date(agendaData[0].event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.posterTitle} numberOfLines={2}>{agendaData[0].title}</Text>
                </View>
              </View>

              {/* CTA Button di Luar Poster */}
              <TouchableOpacity 
                activeOpacity={0.8}
                style={styles.posterCTABtn}
                onPress={() => {
                  setShowAgendaModal(false);
                  router.push('/agenda');
                }}
              >
                <Text style={styles.posterCTAText}>Lihat Detail Acara</Text>
                <Feather name="arrow-right" size={16} color={colors.background} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Pure 3D Floating Icon */}
      {showFloatingAgenda && agendaData.length > 0 && (
        <Animated.View style={[styles.floatingWidgetContainer, { transform: [{ translateY: floatingAnim }] }]}>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push('/agenda')}
            style={styles.floatingWidgetGraphicOnly}
          >
            <Image 
              source={require('../../assets/images/keris_calendar_nobg_v2.png')} 
              style={styles.floatingWidgetImgTrans} 
              resizeMode="contain" 
            />
            
            <TouchableOpacity onPress={() => setShowFloatingAgenda(false)} style={styles.floatingWidgetClose}>
              <Feather name="x" size={12} color="#ffffff" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Permanent Premium Floating FAB for Raja Ali Haji (Biografi & Silsilah) */}
      <View 
        style={[
          styles.floatingBioFABContainer, 
          { 
            bottom: (showFloatingAgenda && agendaData.length > 0) ? 134 : 24
          }
        ]}
      >
        <TouchableOpacity 
          activeOpacity={0.85}
          onPress={() => router.push('/raja-ali-haji')}
          style={styles.floatingBioFABBtn}
        >
          <LinearGradient
            colors={isDark ? ['#d4af37', '#856404'] : ['#f59e0b', '#d97706']}
            style={styles.floatingBioFABGradient}
          >
            <MaterialCommunityIcons name="crown" size={24} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
    paddingBottom: 20, // Reduced from 90 because tab bar is not absolute
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingGroup: {
    flex: 1,
    marginRight: 12,
  },
  greetingTime: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  greetingName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  langDropdown: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 6,
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  langDropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  langDropdownItemActive: {
    backgroundColor: colors.backgroundSecondary,
  },
  langDropdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '800',
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  heroCard: {
    width: '100%',
    height: HERO_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    backgroundColor: colors.border,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 18,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 33,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    marginBottom: 12,
  },
  heroDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    height: '100%',
  },
  dropdownMenuInline: {
    position: 'absolute',
    top: 60, // tepat di bawah search container
    right: 0,
    backgroundColor: colors.card,
    borderRadius: 16,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
    zIndex: 999,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 2,
  },
  dropdownItemActive: {
    backgroundColor: colors.backgroundSecondary,
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  dropdownItemTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b', // warning orange
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offlineBannerText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  weatherCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  weatherLocGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherLocTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  weatherLocSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  weatherLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  weatherLoadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  weatherMainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherLeft: {
    flex: 1,
    gap: 2,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tempText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  weatherStatus: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  weatherDetailText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  weatherRight: {
    width: 130,
    borderLeftWidth: 1.5,
    paddingLeft: 14,
    gap: 4,
    justifyContent: 'center',
  },
  safetyStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  safetyStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  safetyDescText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    lineHeight: 14,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  // Full-Screen Poster Modal Agenda
  modalOverlayPremium: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  posterModalContainer: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  posterImageWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.text,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 25,
  },
  posterFullImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  modalBadgeSegera: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  modalBadgeSegeraText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  posterBottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
  },
  posterDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  posterDateText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  posterTitle: {
    color: colors.background,
    fontSize: 20,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    lineHeight: 26,
  },
  posterCTABtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.text,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  posterCTAText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Floating Widget (Mini Banner)
  floatingWidgetContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    zIndex: 999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  floatingWidgetGraphicOnly: {
    position: 'relative',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingWidgetImgTrans: {
    width: '100%',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  floatingWidgetClose: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  filterBtn: {
    padding: 4,
    marginLeft: 8,
  },
  quickMenusContainer: {
    paddingHorizontal: 0,
    marginTop: 0,
    marginBottom: 20,
  },
  quickMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  quickMenuIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  quickMenuTextWrap: {
    flex: 1,
  },
  quickMenuBtnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  quickMenuBtnDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoriesContainer: {
    paddingBottom: 24,
  },
  quickMenuHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickMenuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  quickMenuSeeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  agendaSectionWrapper: {
    marginBottom: 20,
  },
  agendaScroll: {
    paddingBottom: 10,
  },
  agendaCardMini: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  agendaDateMini: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  agendaDayMini: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  agendaMonthMini: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 1,
  },
  agendaContentMini: {
    flex: 1,
    justifyContent: 'center',
  },
  agendaTitleMini: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  agendaDescMini: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 22,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPillActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  categoryText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: colors.background,
  },
  contentSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    height: 240, // Vertical orientation
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    backgroundColor: colors.border,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  verifiedBadge: {
    backgroundColor: colors.primary, // Warm brown badge
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tagPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  cardBottom: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  ratingText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLocationText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
  },
  floatingBioFABContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 998,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  floatingBioFABBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingBioFABGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  }
});
