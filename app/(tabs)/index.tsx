import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const router = useRouter();
  const { isLoggedIn, user, isAdmin } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const categories = ['Semua', 'Artefak', 'Naskah', 'Monumen', 'Benda'];
  const [activeCategory, setActiveCategory] = useState('Semua');

  const [artifactsData, setArtifactsData] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);

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

  const FastMenuBtn = ({ icon, label, bg, color, onPress }: any) => (
    <TouchableOpacity style={styles.fastMenuBtn} activeOpacity={0.8} onPress={onPress}>
      <View style={[styles.fastMenuIconWrap, { backgroundColor: bg }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={styles.fastMenuLabel} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );

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

          {/* 2. Hero Title */}
          <Text style={styles.heroTitle}>Temukan Warisan{'\n'}Raja Ali Haji</Text>

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
            <TouchableOpacity><Text style={styles.quickMenuSeeAll}>Lihat Semua</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickMenuContainer}>
            <FastMenuBtn icon="map" label="Peta Wisata" bg="#f1f5f9" color="#0f172a" onPress={() => router.push('/map')} />
            <FastMenuBtn icon="book-open" label="Naskah" bg="#f1f5f9" color="#0f172a" onPress={() => router.push('/gallery')} />
            <FastMenuBtn icon="archive" label="Katalog" bg="#f1f5f9" color="#0f172a" onPress={() => router.push('/catalog')} />
            {isAdmin && (
              <FastMenuBtn icon="database" label="Data Admin" bg="#f1f5f9" color="#0f172a" onPress={() => router.push('/admin')} />
            )}
            <FastMenuBtn icon="user" label="Profil Saya" bg="#f1f5f9" color="#0f172a" onPress={() => isLoggedIn ? router.push('/profile') : router.push('/login')} />
            <FastMenuBtn icon="grid" label="Lainnya" bg="#f1f5f9" color="#0f172a" onPress={() => {}} />
          </ScrollView>

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
    paddingBottom: 120, // Space for bottom tabs
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
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 40,
    letterSpacing: -1,
    marginBottom: 24,
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
  quickMenuContainer: {
    paddingBottom: 24,
  },
  fastMenuBtn: {
    alignItems: 'center',
    marginRight: 20,
    width: 60,
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
