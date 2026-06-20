import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { FlashList } from "@shopify/flash-list";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');
const FALLBACK_IMAGE = require('../assets/images/naskah_gurindam_1776493215711.webp');

export default function LikesScreen() {
  const { isDark, colors } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors, isDark);
  const router = useRouter();

  const [savedData, setSavedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Semua' | 'Artefak' | 'Galeri Visual'>('Semua');

  useEffect(() => {
    fetchLikedItems();
  }, []);

  const fetchLikedItems = async () => {
    setLoading(true);
    try {
      const keys = await AsyncStorage.getAllKeys();
      const likeKeys = keys.filter(k => k.startsWith('user_likes_'));
      const pairs = await AsyncStorage.multiGet(likeKeys);
      
      const likedIds = pairs
        .filter(([, value]) => value === 'true')
        .map(([key]) => key.replace('user_likes_', ''));

      let combinedData: any[] = [];

      if (likedIds.length > 0) {
        const legacyIds = likedIds.filter(id => id.startsWith('legacy_')).map(id => id.replace('legacy_', ''));
        const musicIds = likedIds.filter(id => id.startsWith('music_')).map(id => id.replace('music_', ''));
        const oldNumIds = likedIds.filter(id => typeof id === 'number' || (typeof id === 'string' && !id.includes('_')));
        
        const galleryIdsToFetch = [...legacyIds, ...oldNumIds];

        if (galleryIdsToFetch.length > 0) {
          const { data } = await supabase
            .from('gallery_items')
            .select('*, artifacts(name, type, year)')
            .in('id', galleryIdsToFetch);
            
          if (data) {
            const formattedGallery = data.map(item => ({
              ...item,
              id: `legacy_${item.id}`,
              displayType: 'gallery',
              displayTitle: item.title || item.artifacts?.name || t('untitled'),
              displaySubtitle: item.artifacts?.type || t('visualGallery')
            }));
            combinedData = [...combinedData, ...formattedGallery];
          }
        }

        if (musicIds.length > 0) {
          const { data } = await supabase
            .from('musics')
            .select('*')
            .in('id', musicIds);
            
          if (data) {
            const formattedMusic = data.map(item => ({
              ...item,
              id: `music_${item.id}`,
              displayType: 'gallery',
              displayTitle: item.title || t('untitled'),
              displaySubtitle: t('audioMusic')
            }));
            combinedData = [...combinedData, ...formattedMusic];
          }
        }
      }

      setSavedData(combinedData);
    } catch (e) {
      console.warn("Failed to fetch liked items:", e);
    } finally {
      setLoading(false);
    }
  };

  const removeSave = async (id: string, type: string) => {
    try {
      await AsyncStorage.setItem(`user_likes_${id}`, 'false');
      setSavedData(prev => prev.filter(item => String(item.id) !== String(id)));
    } catch (e) {}
  };

  const filteredData = savedData.filter(item => {
    if (activeTab === 'Semua') return true;
    if (activeTab === 'Artefak') return item.displayType === 'artifact';
    if (activeTab === 'Galeri Visual') return item.displayType === 'gallery';
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('likedItems') || 'Item Disukai'}</Text>
        <View style={{ width: 40 }} />
      </View>

      
      {/* Categories Horizontal Scroll */}
      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {(['Semua', 'Artefak', 'Galeri Visual'] as const).map(tab => {
             const isActive = activeTab === tab;
             return (
               <TouchableOpacity 
                 key={tab}
                 style={[styles.categoryPill, isActive ? styles.categoryPillActive : { backgroundColor: colors.border }]}
                 onPress={() => setActiveTab(tab)}
                 activeOpacity={0.8}
               >
                 <Text style={[styles.categoryText, isActive ? styles.categoryTextActive : { color: colors.textSecondary }]}>{tab}</Text>
               </TouchableOpacity>
             )
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <LottieView
            source={require('../assets/animations/Free Searching Animation.json')}
            autoPlay
            loop
            style={{ width: 150, height: 150 }}
          />
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="heart-outline" size={64} color={colors.border} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>{savedData.length === 0 ? 'Belum Ada yang Disukai' : 'Kategori Kosong'}</Text>
          <Text style={styles.emptyDesc}>{savedData.length === 0 ? 'Anda belum menyukai item apapun di galeri.' : `Anda belum menyukai item untuk kategori '${activeTab}'.`}</Text>
          {savedData.length === 0 && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/gallery')} style={styles.exploreBtn}>
              <Text style={styles.exploreBtnTxt}>{t('collectionsExploreBtn')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        
        <View style={{ flex: 1, width: '100%' }}>
          {/* @ts-ignore: estimatedItemSize is required but typing in React 19 might be incompatible */}
          <FlashList estimatedItemSize={260}
          data={filteredData}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity 
              style={[styles.card, { 
                height: 240, 
                marginLeft: index % 2 === 0 ? 4 : 8, 
                marginRight: index % 2 === 0 ? 8 : 4,
                marginBottom: 16 
              }]} 
              activeOpacity={0.8}
              onPress={() => item.displayType === 'artifact' ? router.push(`/artifact/${item.id}` as any) : router.push({ pathname: '/(tabs)/gallery', params: { openItem: item.id } })}
            >
              <Image source={item.image_url ? { uri: item.image_url } : FALLBACK_IMAGE} style={styles.cardImage} />
              <LinearGradient 
                colors={['transparent', 'rgba(0,0,0,0.85)']} 
                locations={[0.2, 1]}
                style={StyleSheet.absoluteFillObject} 
              />
              {item.video_url && (
                <View style={styles.videoBadge}>
                  <Feather name="film" size={12} color="#ffffff" style={{ marginRight: 4 }} />
                </View>
              )}
              <View style={styles.cardOverlay}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.displayTitle}</Text>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>{item.displaySubtitle}</Text>
                </View>
                <TouchableOpacity onPress={() => removeSave(item.id, item.displayType)} style={styles.removeBtn} activeOpacity={0.7}>
                  <Ionicons name="heart" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  exploreBtn: {
    backgroundColor: colors.text,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  
  categoriesWrapper: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryPillActive: {
    backgroundColor: colors.text,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: colors.background,
  },

  exploreBtnTxt: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 15,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.card,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
  },
  videoBadge: {
    position: 'absolute',
    top: 12, right: 12,
    backgroundColor: 'rgba(239,68,68,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  }
});
