import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Image,
  Dimensions,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

const FALLBACK_COVER = require('../../assets/images/naskah_gurindam_1776493215711.jpg');

type BookItem = {
  id: number;
  title: string;
  author: string | null;
  description: string | null;
  cover_url: string | null;
  file_url: string | null;
  file_type: string;
  created_at: string;
};

const PAGE_SIZE = 10;

export default function BooksScreen() {
  const router = useRouter();
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [totalBooks, setTotalBooks] = useState(0);

  const fetchBooks = useCallback(async (refresh = false, pageNum = 0) => {
    if (refresh) {
      setRefreshing(true);
      pageNum = 0;
    } else if (pageNum === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count } = await supabase
      .from('books')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    const fetched = (data as BookItem[]) || [];
    if (count !== null) setTotalBooks(count);
    if (fetched.length < PAGE_SIZE) setHasMore(false);
    else setHasMore(true);

    if (pageNum === 0) {
      setBooks(fetched);
    } else {
      setBooks(prev => [...prev, ...fetched]);
    }

    setPage(pageNum);
    if (refresh) setRefreshing(false);
    else if (pageNum === 0) setLoading(false);
    else setLoadingMore(false);
  }, []);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      fetchBooks(false, page + 1);
    }
  }, [loadingMore, hasMore, loading, page, fetchBooks]);

  useFocusEffect(
    useCallback(() => {
      fetchBooks(false, 0);
    }, [fetchBooks])
  );

  const openBook = (book: BookItem) => {
    if (!book.file_url) {
      Alert.alert('File Belum Tersedia', 'Dokumen untuk buku ini belum diunggah oleh admin.');
      return;
    }
    // Buka In-App PDF Viewer
    setSelectedBook(null); // Tutup modal detail buku terlebih dahulu
    router.push({
      pathname: '/pdf-viewer',
      params: { url: book.file_url, title: book.title }
    });
  };

  const renderBookCard = ({ item }: { item: BookItem }) => (
    <TouchableOpacity 
      style={styles.bookCard}
      activeOpacity={0.85}
      onPress={() => setSelectedBook(item)}
    >
      <View style={styles.coverWrap}>
        <Image
          source={item.cover_url ? { uri: item.cover_url } : FALLBACK_COVER}
          style={styles.coverImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.coverGradient}
        />
        <View style={styles.fileTypeBadge}>
          <Feather name="file-text" size={10} color="#fff" />
          <Text style={styles.fileTypeBadgeText}>{(item.file_type || 'pdf').toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {item.author || 'Anonim'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perpustakaan Digital</Text>
        </View>
      </SafeAreaView>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroIconWrap}>
          <Ionicons name="library" size={28} color="#8B5E3C" />
        </View>
        <Text style={styles.heroTitle}>Koleksi Naskah & Buku</Text>
        <Text style={styles.heroSub}>
          Baca dan unduh naskah kuno, buku sejarah, dan literatur warisan budaya Melayu.
        </Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatNum}>{totalBooks}</Text>
            <Text style={styles.heroStatLabel}>Total Buku</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatNum}>{books.filter(b => b.file_url).length}</Text>
            <Text style={styles.heroStatLabel}>Tersedia</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Memuat perpustakaan...</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderBookCard}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchBooks(true, 0)} tintColor="#0f172a" />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#64748b" />
                <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 8 }}>Memuat lebih banyak...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Feather name="book-open" size={32} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>Belum ada buku</Text>
              <Text style={styles.emptyDesc}>Admin belum menambahkan buku ke perpustakaan.</Text>
            </View>
          }
        />
      )}

      {/* Book Detail Modal */}
      {selectedBook && (
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setSelectedBook(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <View style={styles.modalTopRow}>
              <Image
                source={selectedBook.cover_url ? { uri: selectedBook.cover_url } : FALLBACK_COVER}
                style={styles.modalCover}
                resizeMode="cover"
              />
              <View style={styles.modalInfo}>
                <Text style={styles.modalTitle}>{selectedBook.title}</Text>
                <Text style={styles.modalAuthor}>{selectedBook.author || 'Penulis tidak diketahui'}</Text>
                <View style={styles.modalBadgeRow}>
                  <View style={styles.modalBadge}>
                    <Feather name="file-text" size={12} color="#8B5E3C" />
                    <Text style={styles.modalBadgeText}>{(selectedBook.file_type || 'pdf').toUpperCase()}</Text>
                  </View>
                  <View style={styles.modalBadge}>
                    <Feather name="calendar" size={12} color="#8B5E3C" />
                    <Text style={styles.modalBadgeText}>
                      {new Date(selectedBook.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {selectedBook.description ? (
              <View style={styles.modalDescSection}>
                <Text style={styles.modalDescLabel}>Sinopsis</Text>
                <Text style={styles.modalDescText}>{selectedBook.description}</Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, !selectedBook.file_url && { opacity: 0.5 }]}
                onPress={() => openBook(selectedBook)}
                disabled={!selectedBook.file_url}
              >
                <Feather name="eye" size={18} color="#fff" />
                <Text style={styles.modalBtnText}>Baca / Buka</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBtnOutline}
                onPress={() => setSelectedBook(null)}
              >
                <Text style={styles.modalBtnOutlineText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerArea: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#fdf2e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 24,
    alignItems: 'center',
  },
  heroStatItem: {
    alignItems: 'center',
  },
  heroStatNum: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bookCard: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  coverWrap: {
    width: '100%',
    height: CARD_WIDTH * 1.2,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  fileTypeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  fileTypeBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  bookInfo: {
    padding: 12,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
    lineHeight: 18,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalTopRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  modalCover: {
    width: 100,
    height: 140,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#f1f5f9',
  },
  modalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    lineHeight: 22,
  },
  modalAuthor: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 12,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fdf2e9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  modalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5E3C',
  },
  modalDescSection: {
    marginBottom: 18,
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 14,
  },
  modalDescLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalDescText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 14,
  },
  modalBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBtnOutline: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnOutlineText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
