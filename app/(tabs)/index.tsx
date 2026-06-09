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
  const { t } = useLanguage();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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

  useEffect(() => {
    if (showFloatingAgenda) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingAnim, { toValue: -8, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(floatingAnim, { toValue: 0, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
        ])
      ).start();
    }
  }, [showFloatingAgenda]);

  const fetchUnreadCount = async () => {
    try {
      const uid = user?.id || 'guest';
      const lastRead = await AsyncStorage.getItem(`lastNotifRead_${uid}`);
      let query = supabase.from('notifications').select('id', { count: 'exact', head: true });
      if (lastRead) {
        query = query.gt('created_at', lastRead);
      }
      const { count } = await query;
      setUnreadCount(count || 0);
    } catch (e) {
      setUnreadCount(0);
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
    
    const { data } = await query;
    setArtifactsData(data || []);
    setLoadingContent(false);
  };

  const fetchAgendaFast = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('agenda')
      .select('*')
      .gte('event_date', today) // Hanya ambil yang di masa depan/hari ini
      .order('event_date', { ascending: true })
      .limit(2);
    
    setAgendaData(data || []);

    // Tampilkan popup jika ada agenda terdekat, dibatasi maksimal 1x sehari pakai AsyncStorage
    if (data && data.length > 0 && !hasShownAgendaModal.current) {
      try {
        const lastShownDate = await AsyncStorage.getItem('agenda_popup_date');
        if (lastShownDate !== today) {
          setShowAgendaModal(true);
          await AsyncStorage.setItem('agenda_popup_date', today);
        }
      } catch (e) {
        setShowAgendaModal(true);
      }
      hasShownAgendaModal.current = true;
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAgendaFast();
      fetchUnreadCount();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchArtifacts(),
      fetchAgendaFast()
    ]);
    setRefreshing(false);
  }, [activeCategory]);

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

          {/* Agenda Section — Dipindah ke Atas */}
          {agendaData.length > 0 && (
            <View style={styles.agendaSectionWrapper}>
              <View style={styles.quickMenuHeaderRow}>
                <Text style={styles.quickMenuTitle}>{t('upcomingEvents')}</Text>
                <TouchableOpacity onPress={() => router.push('/agenda')}>
                  <Text style={styles.quickMenuSeeAll}>{t('seeAll')}</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.agendaScroll}>
                {agendaData.map((item) => {
                  const dateInfo = getDayAndMonth(item.event_date);
                  return (
                    <TouchableOpacity key={item.id} style={styles.agendaCardMini} activeOpacity={0.8} onPress={() => router.push('/agenda')}>
                      <View style={styles.agendaDateMini}>
                        <Text style={styles.agendaDayMini}>{dateInfo.day}</Text>
                        <Text style={styles.agendaMonthMini}>{dateInfo.month}</Text>
                      </View>
                      <View style={styles.agendaContentMini}>
                        <Text style={styles.agendaTitleMini} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.agendaDescMini} numberOfLines={1}>{item.description}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

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
  }
});
