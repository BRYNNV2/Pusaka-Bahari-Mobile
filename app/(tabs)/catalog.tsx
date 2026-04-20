import { Feather } from '@expo/vector-icons';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

type ArtifactItem = {
  id: string;
  type: string;
  name: string;
  year: string;
  description: string;
};

// Fallback data jika tabel Supabase belum dibuat
const FALLBACK_DATA: ArtifactItem[] = [
  { id: '1', type: 'Naskah', name: 'Gurindam Dua Belas', year: '1847', description: 'Puisi didaktik berisi nasihat agama dan moral.' },
  { id: '2', type: 'Naskah', name: 'Bustan al-Katibin', year: '1850', description: 'Kitab tata bahasa Melayu yang sistematis.' },
  { id: '3', type: 'Monumen', name: 'Masjid Raya Sultan Riau', year: '1832', description: 'Bangunan ikonis Penyengat berarsitektur menawan.' },
  { id: '4', type: 'Naskah', name: 'Kitab Pengetahuan Bahasa', year: '1858', description: 'Kamus ekabahasa Melayu pertama di Nusantara.' },
  { id: '5', type: 'Benda', name: 'Meriam Tegak', year: 'Abad 19', description: 'Saksi bisu pertahanan maritim Kesultanan masa lalu.' },
];

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'Naskah':  { bg: '#eff6ff', text: '#3b82f6' },
  'Monumen': { bg: '#ecfdf5', text: '#059669' },
  'Benda':   { bg: '#fff7ed', text: '#ea580c' },
};

export default function CatalogScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [database, setDatabase] = useState<ArtifactItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchArtifacts = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('artifacts')
      .select('id, type, name, year, description')
      .order('name', { ascending: true });

    if (fetchError) {
      // Jika tabel belum ada, gunakan fallback data
      setDatabase(FALLBACK_DATA);
      setUsingFallback(true);
    } else {
      setDatabase(data as ArtifactItem[]);
      setUsingFallback(false);
    }

    if (refresh) setIsRefreshing(false);
    else setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchArtifacts();
  }, [fetchArtifacts]);

  const filteredData = database.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeStyle = (type: string) => TYPE_COLORS[type] || { bg: '#f1f5f9', text: '#475569' };

  const renderItem = ({ item }: { item: ArtifactItem }) => {
    const typeStyle = getTypeStyle(item.type);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: typeStyle.bg }]}>
            <Text style={[styles.badgeText, { color: typeStyle.text }]}>{item.type}</Text>
          </View>
          <Text style={styles.year}>{item.year}</Text>
        </View>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.desc}>{item.description}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      <SafeAreaView edges={['top']} style={{ flex: 0, backgroundColor: '#ffffff' }} />
      <View style={styles.content}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Katalog Arsip</Text>
          <Text style={styles.headerDesc}>
            Eksplorasi inventaris peninggalan bersejarah.{' '}
            {usingFallback && <Text style={styles.fallbackNote}>(data lokal)</Text>}
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Feather name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari warisan, monumen..."
              placeholderTextColor="#94a3b8"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Feather name="x" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => fetchArtifacts(true)}>
            <Feather name="refresh-cw" size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0f172a" />
            <Text style={styles.loadingText}>Memuat data arsip...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => fetchArtifacts(true)}
                tintColor="#0f172a"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="inbox" size={48} color="#e2e8f0" style={{ marginBottom: 16 }} />
                <Text style={styles.emptyText}>
                  {searchTerm ? 'Tidak ada yang cocok dengan pencarian.' : 'Tidak ada data peninggalan.'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -1,
    marginBottom: 6,
  },
  headerDesc: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },
  fallbackNote: {
    fontSize: 12,
    color: '#f59e0b',
    fontStyle: 'italic',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 50,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#0f172a',
  },
  filterBtn: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  card: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  year: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  desc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
});
