import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export default function CatalogScreen() {
  const [searchTerm, setSearchTerm] = useState('');

  const database = [
    { id: '1', type: 'Naskah', name: 'Gurindam Dua Belas', year: '1847', desc: 'Puisi didaktik berisi nasihat agama dan moral.' },
    { id: '2', type: 'Naskah', name: 'Bustan al-Katibin', year: '1850', desc: 'Kitab tata bahasa Melayu yang sistematis.' },
    { id: '3', type: 'Monumen', name: 'Masjid Raya Sultan Riau', year: '1832', desc: 'Bangunan ikonis Penyengat berarsitektur menawan.' },
    { id: '4', type: 'Naskah', name: 'Kitab Pengetahuan Bahasa', year: '1858', desc: 'Kamus ekabahasa Melayu pertama di Nusantara.' },
    { id: '5', type: 'Benda', name: 'Meriam Tegak', year: 'Abad 19', desc: 'Saksi bisu pertahanan maritim Kesultanan masa lalu.' },
  ];

  const filteredData = database.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.type}</Text>
        </View>
        <Text style={styles.year}>{item.year}</Text>
      </View>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.desc}>{item.desc}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      <SafeAreaView edges={['top']} style={{ flex: 0, backgroundColor: '#ffffff' }} />
      <View style={styles.content}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Katalog Arsip</Text>
          <Text style={styles.headerDesc}>Eksplorasi inventaris peninggalan bersejarah.</Text>
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
          </View>
          <TouchableOpacity style={styles.filterBtn}>
             <Feather name="sliders" size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredData}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={48} color="#e2e8f0" style={{ marginBottom: 16 }} />
              <Text style={styles.emptyText}>Tidak ada peninggalan yang sesuai.</Text>
            </View>
          }
        />
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
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -1,
    marginBottom: 8,
  },
  headerDesc: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 52,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#0f172a',
  },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  year: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  desc: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 15,
  }
});
