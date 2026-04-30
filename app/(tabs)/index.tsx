import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Platform, StatusBar, Animated, Dimensions, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 280;

const HERO_IMAGES = [
  require('../../assets/images/pusaka_bahari_banner_1776493187345.png'),
  require('../../assets/images/masjid_penyengat_1776493242751.png'),
  require('../../assets/images/naskah_gurindam_1776493215711.png'),
];

export default function HomeScreen() {
  const router = useRouter();
  const { isLoggedIn, user, isAdmin } = useAuth();
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
  const [activeCategory, setActiveCategory] = useState('Semua');

  const [artifactsData, setArtifactsData] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  
  const [showAllMenu, setShowAllMenu] = useState(false);

  const [agendaData, setAgendaData] = useState<any[]>([]);

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
    fetchArtifacts();
  }, [activeCategory]);

  const fetchArtifacts = async () => {
    setLoadingContent(true);
    let query = supabase.from('artifacts').select('*').order('id', { ascending: false });
    
    if (activeCategory !== 'Semua') {
      query = query.eq('type', activeCategory);
    }
    
    const { data } = await query;
    setArtifactsData(data || []);
    setLoadingContent(false);
  };

  const fetchAgendaFast = async () => {
    const { data } = await supabase
      .from('agenda')
      .select('*')
      .order('event_date', { ascending: true })
      .limit(2);
    setAgendaData(data || []);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAgendaFast();
    }, [])
  );

  const FastMenuBtn = ({ icon, label, bg, color, onPress }: any) => (
    <TouchableOpacity style={styles.fastMenuBtn} activeOpacity={0.8} onPress={onPress}>
      <View style={[styles.fastMenuIconWrap, { backgroundColor: bg }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={styles.fastMenuLabel} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );

  const menuItems = [
    { id: 'map', icon: 'map', label: 'Peta Wisata', onPress: () => router.push('/map') },
    { id: 'gallery', icon: 'book-open', label: 'Naskah', onPress: () => router.push('/gallery') },
    { id: 'catalog', icon: 'archive', label: 'Katalog', onPress: () => router.push('/catalog') },
    { id: 'agenda', icon: 'calendar', label: 'Agenda', onPress: () => router.push('/agenda') },
    { id: 'profile', icon: 'user', label: 'Profil Saya', onPress: () => isLoggedIn ? router.push('/profile') : router.push('/login') },
  ];

  if (isAdmin) {
    menuItems.splice(3, 0, { id: 'admin', icon: 'database', label: 'Data Admin', onPress: () => router.push('/admin') });
  }

  const visibleMenus = showAllMenu ? menuItems : menuItems.slice(0, 4);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView bounces={true} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* 1. Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.locationGroup}>
              <View style={styles.mapIconWrap}>
                <Ionicons name="location-outline" size={24} color="#0f172a" />
              </View>
              <View style={styles.locationPill}>
                <Text style={styles.locationText}>Penyengat, Kepri</Text>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              <TouchableOpacity style={styles.bellBtn}>
                <Feather name="bell" size={20} color="#0f172a" />
                <View style={styles.bellBadge} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.avatarBtn} 
                onPress={() => isLoggedIn ? router.push('/profile') : router.push('/login')}
                activeOpacity={0.8}
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Feather name="user" size={20} color="#64748b" />
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
                <Ionicons name="compass" size={13} color="#fff" />
                <Text style={styles.heroBadgeText}>Jelajahi Sekarang</Text>
              </View>
              <Text style={styles.heroTitle}>Temukan Warisan{"\n"}Raja Ali Haji</Text>
              <Text style={styles.heroSubtitle}>Pusaka Pulau Penyengat, Kepulauan Riau</Text>

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
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color="#64748b" style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Cari gurindam, kitab, atau sejarah..."
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity style={styles.filterBtn}>
              <Ionicons name="options-outline" size={20} color="#0f172a" />
            </TouchableOpacity>
          </View>

          {/* Akses Cepat (Menu Icons) */}
          <View style={styles.quickMenuHeaderRow}>
            <Text style={styles.quickMenuTitle}>Menu Utama</Text>
            {menuItems.length > 4 && (
              <TouchableOpacity onPress={() => setShowAllMenu(!showAllMenu)} activeOpacity={0.7}>
                <Text style={styles.quickMenuSeeAll}>{showAllMenu ? 'Tutup' : 'Lihat Semua'}</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.quickMenuGrid}>
            {visibleMenus.map(menu => (
              <FastMenuBtn 
                key={menu.id} 
                icon={menu.icon} 
                label={menu.label} 
                bg="#f1f5f9" 
                color="#0f172a" 
                onPress={menu.onPress} 
              />
            ))}
          </View>


          {/* 4. Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
            {categories.map((item, index) => {
              const isActive = activeCategory === item;
              return (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                  onPress={() => setActiveCategory(item)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 5. Content Grid */}
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Eksplorasi Terdekat</Text>

            <View style={styles.gridContainer}>
              {loadingContent ? (
                <View style={{ width: '100%', padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#94a3b8' }}>Memuat data sejarah...</Text>
                </View>
              ) : artifactsData.length === 0 ? (
                <View style={{ width: '100%', padding: 40, alignItems: 'center' }}>
                  <Feather name="inbox" size={32} color="#cbd5e1" style={{ marginBottom: 12 }} />
                  <Text style={{ color: '#94a3b8', fontWeight: '500' }}>Belum ada data untuk kategori ini.</Text>
                </View>
              ) : artifactsData.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.card} 
                  activeOpacity={0.9} 
                  onPress={() => router.push(`/artifact/${item.id}` as any)}
                >
                  <Image 
                    source={item.image_url ? { uri: item.image_url } : require('../../assets/images/naskah_gurindam_1776493215711.png')} 
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
                      <MaterialCommunityIcons name="shield-check" size={14} color="#fff" />
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
                      <Ionicons name="time-outline" size={12} color="#cbd5e1" />
                      <Text style={styles.cardLocationText} numberOfLines={1}>{item.year || 'Abad 19'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Agenda Section — di paling bawah */}
          {agendaData.length > 0 && (
            <View style={styles.agendaSectionWrapper}>
              <View style={styles.quickMenuHeaderRow}>
                <Text style={styles.quickMenuTitle}>Agenda Mendatang</Text>
                <TouchableOpacity onPress={() => router.push('/agenda')}>
                  <Text style={styles.quickMenuSeeAll}>Lihat Semua</Text>
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

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
    paddingBottom: 90, // Space for bottom tabs
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  locationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapIconWrap: {
    marginRight: 6,
  },
  locationPill: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  locationText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
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
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
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
    backgroundColor: '#1e293b',
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
    color: '#fff',
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
    backgroundColor: '#f8fafc',
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
    height: '100%',
  },
  filterBtn: {
    padding: 4,
    marginLeft: 8,
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
    color: '#0f172a',
  },
  quickMenuSeeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  quickMenuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 4,
    justifyContent: 'flex-start',
  },
  fastMenuBtn: {
    alignItems: 'center',
    width: '25%',
    marginBottom: 20,
  },
  fastMenuIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  fastMenuLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  categoriesContainer: {
    paddingBottom: 24,
  },
  agendaSectionWrapper: {
    marginBottom: 20,
  },
  agendaScroll: {
    paddingBottom: 10,
  },
  agendaCardMini: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  agendaDayMini: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  agendaMonthMini: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3b82f6',
    marginTop: 1,
  },
  agendaContentMini: {
    flex: 1,
    justifyContent: 'center',
  },
  agendaTitleMini: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  agendaDescMini: {
    fontSize: 12,
    color: '#64748b',
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    marginRight: 10,
  },
  categoryPillActive: {
    backgroundColor: '#0f172a',
  },
  categoryText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  contentSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
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
    backgroundColor: '#f1f5f9',
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
    backgroundColor: '#3b82f6', // Trusted blue badge
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    // Add subtle frosted glass effect if possible:
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
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
    color: '#cbd5e1',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
  }
});
