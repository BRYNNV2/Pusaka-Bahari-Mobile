import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Image,
  Dimensions,
  Modal,
  ScrollView,
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const customLayoutSpring = {
  duration: 400,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.spring,
    springDamping: 0.75,
  },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type ArtifactItem = {
  id: string;
  type: string;
  name: string;
  year: string;
  description: string;
  image_url?: string;
  location?: string;
};



const KAMUS_DATA = [
  { id: 'k1', term: 'Angin Muson', definition: 'Angin pergantian musim yang digunakan pelaut kuno untuk menentukan waktu paling aman untuk berlayar.' },
  { id: 'k2', term: 'Bintang Pari', definition: 'Gugusan bintang rasi pari (Crux) yang selalu menunjuk ke arah Selatan. Sangat penting untuk navigasi malam hari di tengah laut.' },
  { id: 'k3', term: 'Haluan', definition: 'Bagian depan dari perahu atau kapal laut.' },
  { id: 'k4', term: 'Buritan', definition: 'Bagian belakang dari perahu atau kapal laut, tempat kemudi biasanya berada.' },
  { id: 'k5', term: 'Pencalang', definition: 'Perahu pengintai (mencalang = mengintai), biasanya melaju di depan armada besar.' },
  { id: 'k6', term: 'Sauh', definition: 'Sebutan tradisional Melayu untuk jangkar, dulunya terbuat dari kayu keras dan batu pemberat.' },
  { id: 'k7', term: 'Tanjak', definition: 'Penutup kepala adat pria Melayu yang bentuk lipatannya melambangkan status dan keberanian.' },
  { id: 'k8', term: 'Kajang', definition: 'Atap perahu tradisional yang terbuat dari anyaman daun nipah atau pandan.' },
].sort((a, b) => a.term.localeCompare(b.term));

const CATEGORIES = ['Semua', 'Benda Pusaka', 'Tradisi Bahari', 'Naskah Kuno', 'Monumen', 'Kamus Istilah'];

const TYPE_MAP: Record<string, string> = {
  'Benda Pusaka': 'Benda',
  'Tradisi Bahari': 'Tradisi',
  'Naskah Kuno': 'Naskah',
  'Monumen': 'Monumen',
};

const TYPE_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
  'Naskah':  { bg: '#fdf4eb', text: '#8B5E3C', icon: 'book' },
  'Monumen': { bg: '#ecfdf5', text: '#059669', icon: 'map-pin' },
  'Benda':   { bg: '#fff7ed', text: '#ea580c', icon: 'archive' },
  'Tradisi': { bg: '#f5f3ff', text: '#8b5cf6', icon: 'anchor' },
};

const FALLBACK_IMAGE = require('../../assets/images/naskah_gurindam_1776493215711.webp');

const PAGE_SIZE = 20;

export default function CatalogScreen() {
  const { mode, isDark, colors } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors, isDark);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [database, setDatabase] = useState<ArtifactItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ArtifactItem | null>(null);
  const [selectedKamus, setSelectedKamus] = useState<typeof KAMUS_DATA[0] | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchArtifacts = useCallback(async (refresh = false, pageNum = 0) => {
    if (refresh) {
      setIsRefreshing(true);
      pageNum = 0;
    } else if (pageNum === 0) {
      setIsLoading(true);
    } else {
      setLoadingMore(true);
    }

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('catalogs')
      .select('id, type, name, year, description, image_url, location')
      .order('name', { ascending: true })
      .range(from, to);

    const fetched = data || [];
    if (fetched.length < PAGE_SIZE) setHasMore(false);
    else setHasMore(true);

    if (pageNum === 0) {
      setDatabase(fetched);
    } else {
      setDatabase(prev => [...prev, ...fetched]);
    }

    setPage(pageNum);
    if (refresh) setIsRefreshing(false);
    else if (pageNum === 0) setIsLoading(false);
    else setLoadingMore(false);
  }, []);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !isLoading) {
      fetchArtifacts(false, page + 1);
    }
  }, [loadingMore, hasMore, isLoading, page, fetchArtifacts]);

  useFocusEffect(
    useCallback(() => {
      fetchArtifacts(false, 0);
    }, [fetchArtifacts])
  );

  const filteredData = database.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeCategory === 'Semua') return matchesSearch;
    return matchesSearch && item.type === TYPE_MAP[activeCategory];
  });

  const getTypeStyle = (type: string) => TYPE_COLORS[type] || { bg: colors.border, text: colors.textSecondary, icon: 'box' };

  const renderItem = ({ item }: { item: ArtifactItem }) => {
    const typeStyle = getTypeStyle(item.type);
    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.9}
        onPress={() => setSelectedItem(item)}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={item.image_url ? { uri: item.image_url } : FALLBACK_IMAGE} 
            style={styles.cardImage} 
          />
          <View style={styles.imageOverlay} />
          <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : typeStyle.bg }]}>
            <Feather name={typeStyle.icon} size={10} color={typeStyle.text} style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: typeStyle.text }]}>{item.type}</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.year}>{item.year}</Text>
          <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderKamusItem = ({ item }: { item: typeof KAMUS_DATA[0] }) => {
    return (
      <TouchableOpacity 
        style={styles.kamusCard} 
        activeOpacity={0.8}
        onPress={() => setSelectedKamus(item)}
      >
        <View style={styles.kamusIcon}>
          <Text style={styles.kamusLetter}>{item.term.charAt(0)}</Text>
        </View>
        <View style={styles.kamusContent}>
          <Text style={styles.kamusTerm}>{item.term}</Text>
          <Text style={styles.kamusDef} numberOfLines={2}>{item.definition}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} translucent={false} />
      <SafeAreaView edges={['top']} style={{ flex: 0, backgroundColor: colors.card }} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('catalogHeader')}</Text>
        <Text style={styles.headerDesc}>
          {t('catalogDesc')}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('catalogSearch')}
            placeholderTextColor={colors.textSecondary}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Feather name="x" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories Horizontal Scroll */}
      <View style={styles.categoriesWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
          renderItem={({ item }) => {
            const isActive = activeCategory === item;
            return (
              <TouchableOpacity 
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => {
                  LayoutAnimation.configureNext(customLayoutSpring);
                  setActiveCategory(item);
                }}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Content List */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.text} />
            <Text style={styles.loadingText}>{t('catalogLoading')}</Text>
          </View>
        ) : activeCategory === 'Kamus Istilah' ? (
          <FlatList
            key="kamus-list"
            data={KAMUS_DATA.filter(k => k.term.toLowerCase().includes(searchTerm.toLowerCase()) || k.definition.toLowerCase().includes(searchTerm.toLowerCase()))}
            keyExtractor={item => item.id}
            renderItem={renderKamusItem}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 0, paddingTop: 16, gap: 16 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="search" size={48} color="#e2e8f0" style={{ marginBottom: 16 }} />
                <Text style={styles.emptyText}>{t('catalogKamusEmpty')}</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            key="catalog-grid"
            data={filteredData}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 24 }}
            contentContainerStyle={{ paddingBottom: 110, paddingTop: 8, gap: 20 }}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchArtifacts(true, 0)} tintColor="#0f172a" />
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>Memuat lebih banyak...</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="inbox" size={48} color="#e2e8f0" style={{ marginBottom: 16 }} />
                <Text style={styles.emptyText}>{t('catalogEmpty')}</Text>
              </View>
            }
          />
        )}
      </View>

      {/* --- MODAL DETAIL ITEM --- */}
      {selectedItem && (
        <Modal visible={!!selectedItem} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedItem(null)}>
          <View style={styles.detailContainer}>
            {/* Header / Foto Full */}
            <View style={styles.detailImageWrapper}>
              <Image 
                source={selectedItem.image_url ? { uri: selectedItem.image_url } : FALLBACK_IMAGE} 
                style={styles.detailImage} 
              />
              <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFillObject} />
              
              <TouchableOpacity style={styles.closeDetailBtn} onPress={() => setSelectedItem(null)}>
                <Feather name="x" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Informasi Detail */}
            <View style={styles.detailContent}>
              <View style={[styles.badge, { backgroundColor: getTypeStyle(selectedItem.type).bg, alignSelf: 'flex-start', position: 'relative', top: 0, left: 0, marginBottom: 12 }]}>
                <Feather name={getTypeStyle(selectedItem.type).icon} size={12} color={getTypeStyle(selectedItem.type).text} style={{ marginRight: 6 }} />
                <Text style={[styles.badgeText, { color: getTypeStyle(selectedItem.type).text, fontSize: 12 }]}>{selectedItem.type}</Text>
              </View>

              <Text style={styles.detailTitle}>{selectedItem.name}</Text>
              
              <View style={styles.metaRow}>
                <View style={styles.metaBox}>
                  <Feather name="calendar" size={16} color={colors.textSecondary} style={{ marginBottom: 4 }} />
                  <Text style={styles.metaLabel}>{t('catalogYearEra')}</Text>
                  <Text style={styles.metaValue}>{selectedItem.year}</Text>
                </View>
                <View style={styles.metaBox}>
                  <Feather name="map-pin" size={16} color={colors.textSecondary} style={{ marginBottom: 4 }} />
                  <Text style={styles.metaLabel}>{t('catalogLocation')}</Text>
                  <Text style={styles.metaValue} numberOfLines={2}>{selectedItem.location || t('catalogDefaultLocation')}</Text>
                </View>
              </View>

              <Text style={styles.detailSectionTitle}>{t('catalogHistoryDesc')}</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                <Text style={styles.detailDescText}>{selectedItem.description}</Text>
                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* --- MODAL DETAIL KAMUS --- */}
      {selectedKamus && (
        <Modal visible={!!selectedKamus} animationType="fade" transparent={true} onRequestClose={() => setSelectedKamus(null)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <View style={{ width: '100%', backgroundColor: colors.card, borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 }}>
              <View style={[styles.kamusIcon, { width: 64, height: 64, borderRadius: 32, marginBottom: 16 }]}>
                <Text style={[styles.kamusLetter, { fontSize: 28 }]}>{selectedKamus.term.charAt(0)}</Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 12, textAlign: 'center' }}>
                {selectedKamus.term}
              </Text>
              <Text style={{ fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 32 }}>
                {selectedKamus.definition}
              </Text>
              <TouchableOpacity 
                onPress={() => setSelectedKamus(null)} 
                style={{ width: '100%', paddingVertical: 14, backgroundColor: colors.text, borderRadius: 14, alignItems: 'center' }}
              >
                <Text style={{ color: colors.card, fontWeight: '700', fontSize: 16 }}>{t('catalogCloseModal')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: colors.card,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
    marginBottom: 6,
  },
  headerDesc: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  searchWrapper: {
    backgroundColor: colors.card,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: colors.text,
  },
  categoriesWrapper: {
    backgroundColor: colors.card,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.border,
  },
  categoryPillActive: {
    backgroundColor: colors.text,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: colors.card,
  },
  listContainer: {
    flex: 1,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  card: {
    width: (width - 48 - 20) / 2, // 2 columns, padding 24 each side, 20 gap
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardContent: {
    padding: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  year: {
    fontSize: 12,
    color: '#8B5E3C',
    fontWeight: '600',
    marginBottom: 6,
  },
  desc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Detail Modal Styles
  detailContainer: {
    flex: 1,
    backgroundColor: colors.card,
  },
  detailImageWrapper: {
    width: '100%',
    height: 350,
    position: 'relative',
  },
  detailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  closeDetailBtn: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  detailContent: {
    flex: 1,
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 24,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metaBox: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  detailDescText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 26,
  },
  
  // Kamus Styles
  kamusCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  kamusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  kamusLetter: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8B5E3C',
  },
  kamusContent: {
    flex: 1,
  },
  kamusTerm: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  kamusDef: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
