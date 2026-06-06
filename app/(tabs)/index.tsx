import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Platform, StatusBar, Animated, Dimensions, Easing, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
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
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('agenda')
      .select('*')
      .gte('event_date', today) // Hanya ambil yang di masa depan/hari ini
      .order('event_date', { ascending: true })
      .limit(2);
    
    setAgendaData(data || []);

    // Tampilkan popup jika ada agenda terdekat dan belum ditampilkan di sesi ini
    if (data && data.length > 0 && !hasShownAgendaModal.current) {
      setShowAgendaModal(true);
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
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView 
          bounces={true} 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5E3C" colors={['#8B5E3C']} />
          }
        >
          
          {/* 1. Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.greetingGroup}>
              <Text style={styles.greetingTime}>
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 11) return 'Selamat Pagi 🌅';
                  if (hour < 15) return 'Selamat Siang ☀️';
                  if (hour < 18) return 'Selamat Sore 🌇';
                  return 'Selamat Malam 🌙';
                })()}
              </Text>
              <Text style={styles.greetingName} numberOfLines={1}>
                {isLoggedIn ? (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pengguna') : 'Jelajahi Warisan Budaya'}
              </Text>
            </View>

            <View style={styles.headerRightActions}>
              <TouchableOpacity style={styles.bellBtn} onPress={() => router.push('/notifications' as any)}>
                <Feather name="bell" size={20} color="#0f172a" />
                {unreadCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
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
              placeholder="Cari naskah, artefak, atau sejarah..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity style={styles.filterBtn} onPress={() => setSearchQuery('')}>
                <Feather name="x" size={20} color="#ef4444" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.filterBtn}>
                <Ionicons name="options-outline" size={20} color="#0f172a" />
              </TouchableOpacity>
            )}
          </View>

          {/* Agenda Section — Dipindah ke Atas */}
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

          {/* 4. Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
            {categories.map((item, index) => {
              const isActive = activeCategory === item;
              const iconConfig = CATEGORY_ICONS[item];
              const iconColor = isActive ? '#ffffff' : '#5c4033';
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
            <Text style={styles.sectionTitle}>Eksplorasi Terdekat</Text>

            <View style={styles.gridContainer}>
              {loadingContent ? (
                <View style={{ width: '100%', padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#94a3b8' }}>Memuat data sejarah...</Text>
                </View>
              ) : filteredArtifacts.length === 0 ? (
                <View style={{ width: '100%', padding: 40, alignItems: 'center' }}>
                  <Feather name={searchQuery ? "search" : "inbox"} size={32} color="#cbd5e1" style={{ marginBottom: 12 }} />
                  <Text style={{ color: '#94a3b8', fontWeight: '500', textAlign: 'center' }}>
                    {searchQuery 
                      ? `Tidak ada hasil untuk "${searchQuery}"` 
                      : 'Belum ada data untuk kategori ini.'}
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
                  <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.posterFullImage}>
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
                <Feather name="arrow-right" size={16} color="#ffffff" />
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
              <Feather name="x" size={12} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}

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
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  greetingName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
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
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
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
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
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
    backgroundColor: '#0f172a',
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
    color: '#fbbf24',
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
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
  },
  posterTitle: {
    color: '#ffffff',
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
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  posterCTAText: {
    color: '#ffffff',
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
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
    backgroundColor: '#fdf2e9',
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
    color: '#0f172a',
    marginBottom: 4,
  },
  quickMenuBtnDesc: {
    fontSize: 12,
    color: '#64748b',
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
    color: '#0f172a',
  },
  quickMenuSeeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5E3C',
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
    color: '#8B5E3C',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#f5f0eb',
    borderRadius: 22,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e8ddd2',
  },
  categoryPillActive: {
    backgroundColor: '#3c2415',
    borderColor: '#3c2415',
  },
  categoryText: {
    color: '#5c4033',
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
    backgroundColor: '#8B5E3C', // Warm brown badge
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
