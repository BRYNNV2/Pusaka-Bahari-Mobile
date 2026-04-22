import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabId = 'artifacts' | 'locations' | 'gallery' | 'agenda';

const TABS: { id: TabId; label: string; icon: string; table: string }[] = [
  { id: 'artifacts', label: 'Artefak',  icon: 'archive',  table: 'artifacts'      },
  { id: 'locations', label: 'Lokasi',   icon: 'map-pin',  table: 'map_locations'  },
  { id: 'gallery',   label: 'Galeri',   icon: 'image',    table: 'gallery_items'  },
  { id: 'agenda',    label: 'Agenda',   icon: 'calendar', table: 'agenda'         },
];

const TYPE_OPTIONS = ['Artefak', 'Naskah', 'Monumen', 'Benda'];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminPanel() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>('artifacts');
  const [data, setData]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem]   = useState<any | null>(null);
  const [stats, setStats]               = useState<Record<TabId, number>>({
    artifacts: 0, locations: 0, gallery: 0, agenda: 0,
  });

  // ── Form Fields ──────────────────────────────────────────────────────────────
  // Artifacts
  const [aType, setAType] = useState('Artefak');
  const [aName, setAName] = useState('');
  const [aYear, setAYear] = useState('');
  const [aDesc, setADesc] = useState('');
  // Locations
  const [lTitle, setLTitle] = useState('');
  const [lDesc,  setLDesc]  = useState('');
  const [lLat,   setLLat]   = useState('');
  const [lLng,   setLLng]   = useState('');
  // Gallery
  const [gTitle, setGTitle] = useState('');
  const [gDesc,  setGDesc]  = useState('');
  const [gAudio, setGAudio] = useState('');
  const [gOrder, setGOrder] = useState('0');
  // Agenda
  const [agTitle, setAgTitle] = useState('');
  const [agDesc,  setAgDesc]  = useState('');
  const [agDate,  setAgDate]  = useState('');

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const currentTab = TABS.find(t => t.id === activeTab)!;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from(currentTab.table)
      .select('*')
      .order('id', { ascending: false });
    setData(rows ?? []);
    setLoading(false);
  }, [activeTab]);

  const fetchStats = useCallback(async () => {
    const results = await Promise.all(
      TABS.map(tab =>
        supabase.from(tab.table).select('id', { count: 'exact', head: true })
      )
    );
    const newStats: Record<TabId, number> = { artifacts: 0, locations: 0, gallery: 0, agenda: 0 };
    TABS.forEach((tab, i) => {
      newStats[tab.id] = results[i].count ?? 0;
    });
    setStats(newStats);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Form ─────────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setAType('Artefak'); setAName(''); setAYear(''); setADesc('');
    setLTitle(''); setLDesc(''); setLLat(''); setLLng('');
    setGTitle(''); setGDesc(''); setGAudio(''); setGOrder('0');
    setAgTitle(''); setAgDesc(''); setAgDate('');
    setEditingItem(null);
  };

  const openAdd = () => { resetForm(); setModalVisible(true); };

  const openEdit = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'artifacts') {
      setAType(item.type ?? 'Artefak'); setAName(item.name ?? '');
      setAYear(item.year ?? '');       setADesc(item.description ?? '');
    } else if (activeTab === 'locations') {
      setLTitle(item.title ?? '');     setLDesc(item.description ?? '');
      setLLat(String(item.latitude ?? '')); setLLng(String(item.longitude ?? ''));
    } else if (activeTab === 'gallery') {
      setGTitle(item.title ?? '');     setGDesc(item.description ?? '');
      setGAudio(item.audio_url ?? ''); setGOrder(String(item.sort_order ?? 0));
    } else if (activeTab === 'agenda') {
      setAgTitle(item.title ?? '');    setAgDesc(item.description ?? '');
      setAgDate(item.event_date ?? '');
    }
    setModalVisible(true);
  };

  const getFormData = (): Record<string, any> | null => {
    if (activeTab === 'artifacts') {
      if (!aName.trim()) return null;
      return { 
        type: aType, 
        name: aName.trim(), 
        year: aYear.trim() || null, 
        description: aDesc.trim() || null 
      };
    }
    if (activeTab === 'locations') {
      if (!lTitle.trim()) return null;
      return { 
        title: lTitle.trim(), 
        description: lDesc.trim() || null, 
        latitude: lLat.trim() ? parseFloat(lLat) : null, 
        longitude: lLng.trim() ? parseFloat(lLng) : null 
      };
    }
    if (activeTab === 'gallery') {
      if (!gTitle.trim()) return null;
      return { 
        title: gTitle.trim(), 
        description: gDesc.trim() || null, 
        audio_url: gAudio.trim() || null, 
        sort_order: gOrder.trim() ? parseInt(gOrder) : 0 
      };
    }
    if (activeTab === 'agenda') {
      if (!agTitle.trim()) return null;
      return { 
        title: agTitle.trim(), 
        description: agDesc.trim() || null, 
        event_date: agDate.trim() || null 
      };
    }
    return null;
  };

  const handleSave = async () => {
    const formData = getFormData();
    if (!formData) { Alert.alert('Perhatian', 'Nama / Judul wajib diisi.'); return; }
    setSaving(true);
    const op = editingItem
      ? supabase.from(currentTab.table).update(formData).eq('id', editingItem.id)
      : supabase.from(currentTab.table).insert([formData]);
    const { error } = await op;
    setSaving(false);
    if (error) {
      Alert.alert('Gagal menyimpan', error.message);
    } else {
      setModalVisible(false);
      resetForm();
      fetchData();
      fetchStats();
    }
  };

  const handleDelete = (item: any) => {
    const label = item.name ?? item.title ?? 'item ini';
    Alert.alert('Hapus Data', `Yakin ingin menghapus "${label}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from(currentTab.table).delete().eq('id', item.id);
          if (error) Alert.alert('Gagal', error.message);
          else { fetchData(); fetchStats(); }
        },
      },
    ]);
  };

  // ── Renderers ────────────────────────────────────────────────────────────────
  const renderItemMeta = (item: any) => {
    if (activeTab === 'artifacts') return (
      <>
        <View style={styles.itemRow}>
          <View style={styles.badge}><Text style={styles.badgeText}>{item.type}</Text></View>
          <Text style={styles.metaText}>{item.year}</Text>
        </View>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
      </>
    );
    if (activeTab === 'locations') return (
      <>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
        <Text style={styles.metaText}>📍 {item.latitude}, {item.longitude}</Text>
      </>
    );
    if (activeTab === 'gallery') return (
      <>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
        <Text style={styles.metaText}>🎵 {item.audio_url ? 'Audio tersedia' : 'Tidak ada audio'}</Text>
      </>
    );
    if (activeTab === 'agenda') return (
      <>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
        <Text style={styles.metaText}>📅 {item.event_date}</Text>
      </>
    );
    return null;
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.listCard}>
      <View style={styles.listCardBody}>{renderItemMeta(item)}</View>
      <View style={styles.listCardActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
          <Feather name="edit-2" size={15} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Feather name="trash-2" size={15} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderForm = () => {
    if (activeTab === 'artifacts') return (
      <>
        <Text style={styles.formLabel}>Tipe Artefak</Text>
        <View style={styles.typeRow}>
          {TYPE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.typeChip, aType === opt && styles.typeChipActive]}
              onPress={() => setAType(opt)}
            >
              <Text style={[styles.typeChipText, aType === opt && styles.typeChipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.formLabel}>Nama Artefak <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.formInput} value={aName} onChangeText={setAName} placeholder="Nama artefak..." placeholderTextColor="#94a3b8" />
        <Text style={styles.formLabel}>Tahun</Text>
        <TextInput style={styles.formInput} value={aYear} onChangeText={setAYear} placeholder="cth: 1847" placeholderTextColor="#94a3b8" />
        <Text style={styles.formLabel}>Deskripsi</Text>
        <TextInput style={[styles.formInput, styles.formTextarea]} value={aDesc} onChangeText={setADesc} placeholder="Deskripsi singkat..." placeholderTextColor="#94a3b8" multiline numberOfLines={4} textAlignVertical="top" />
      </>
    );

    if (activeTab === 'locations') return (
      <>
        <Text style={styles.formLabel}>Nama Lokasi <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.formInput} value={lTitle} onChangeText={setLTitle} placeholder="Nama lokasi..." placeholderTextColor="#94a3b8" />
        <Text style={styles.formLabel}>Deskripsi</Text>
        <TextInput style={[styles.formInput, styles.formTextarea]} value={lDesc} onChangeText={setLDesc} placeholder="Deskripsi lokasi..." placeholderTextColor="#94a3b8" multiline numberOfLines={3} textAlignVertical="top" />
        <Text style={styles.formLabel}>Latitude</Text>
        <TextInput style={styles.formInput} value={lLat} onChangeText={setLLat} placeholder="cth: 0.9250" placeholderTextColor="#94a3b8" keyboardType="numeric" />
        <Text style={styles.formLabel}>Longitude</Text>
        <TextInput style={styles.formInput} value={lLng} onChangeText={setLLng} placeholder="cth: 104.4168" placeholderTextColor="#94a3b8" keyboardType="numeric" />
      </>
    );

    if (activeTab === 'gallery') return (
      <>
        <Text style={styles.formLabel}>Judul <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.formInput} value={gTitle} onChangeText={setGTitle} placeholder="Judul item galeri..." placeholderTextColor="#94a3b8" />
        <Text style={styles.formLabel}>Deskripsi</Text>
        <TextInput style={[styles.formInput, styles.formTextarea]} value={gDesc} onChangeText={setGDesc} placeholder="Deskripsi..." placeholderTextColor="#94a3b8" multiline numberOfLines={3} textAlignVertical="top" />
        <Text style={styles.formLabel}>URL Audio</Text>
        <TextInput style={styles.formInput} value={gAudio} onChangeText={setGAudio} placeholder="https://..." placeholderTextColor="#94a3b8" keyboardType="url" autoCapitalize="none" />
        <Text style={styles.formLabel}>Urutan Tampil</Text>
        <TextInput style={styles.formInput} value={gOrder} onChangeText={setGOrder} placeholder="0" placeholderTextColor="#94a3b8" keyboardType="numeric" />
      </>
    );

    if (activeTab === 'agenda') return (
      <>
        <Text style={styles.formLabel}>Nama Acara <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.formInput} value={agTitle} onChangeText={setAgTitle} placeholder="Nama acara budaya..." placeholderTextColor="#94a3b8" />
        <Text style={styles.formLabel}>Deskripsi</Text>
        <TextInput style={[styles.formInput, styles.formTextarea]} value={agDesc} onChangeText={setAgDesc} placeholder="Deskripsi acara..." placeholderTextColor="#94a3b8" multiline numberOfLines={3} textAlignVertical="top" />
        <Text style={styles.formLabel}>Tanggal (YYYY-MM-DD)</Text>
        <TextInput style={styles.formInput} value={agDate} onChangeText={setAgDate} placeholder="cth: 2026-10-25" placeholderTextColor="#94a3b8" />
      </>
    );

    return null;
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── Header ── */}
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <Feather name="arrow-left" size={22} color="#0f172a" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.headerTitle}>Panel Admin</Text>
            <Text style={styles.headerSub} numberOfLines={1}>{user?.email}</Text>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert('Keluar', 'Yakin ingin keluar?', [
              { text: 'Batal', style: 'cancel' },
              { text: 'Keluar', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
            ])}
            style={styles.headerIcon}
          >
            <Feather name="log-out" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* ── Stats Row ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.statCard, activeTab === tab.id && styles.statCardActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Feather name={tab.icon as any} size={18} color={activeTab === tab.id ? '#ffffff' : '#64748b'} />
              <Text style={[styles.statCount, activeTab === tab.id && { color: '#ffffff' }]}>{stats[tab.id]}</Text>
              <Text style={[styles.statLabel, activeTab === tab.id && { color: 'rgba(255,255,255,0.8)' }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Section Label ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Daftar {currentTab.label}</Text>
          <Text style={styles.sectionCount}>{data.length} item</Text>
        </View>
      </SafeAreaView>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Feather name="inbox" size={52} color="#e2e8f0" />
              <Text style={styles.emptyTitle}>Belum ada data</Text>
              <Text style={styles.emptyDesc}>Ketuk tombol + di bawah untuk menambahkan.</Text>
            </View>
          }
        />
      )}

      {/* ── FAB ── */}
      <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.85}>
        <Feather name="plus" size={26} color="white" />
      </TouchableOpacity>

      {/* ── Add / Edit Modal ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setModalVisible(false); resetForm(); }}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{editingItem ? 'Edit Data' : 'Tambah Data Baru'}</Text>
                <Text style={styles.modalSub}>{currentTab.label}</Text>
              </View>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} style={styles.modalClose}>
                <Feather name="x" size={22} color="#0f172a" />
              </TouchableOpacity>
            </View>

            {/* Modal Form */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {renderForm()}
              <View style={{ height: 32 }} />
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnOff]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="white" size="small" />
                  : <Text style={styles.saveBtnText}>{editingItem ? 'Simpan Perubahan' : 'Tambah Data'}</Text>
                }
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  safeTop: { backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },

  // Stats
  statsRow: { paddingVertical: 12 },
  statCard: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14, minWidth: 84, gap: 4 },
  statCardActive: { backgroundColor: '#0f172a' },
  statCount: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#64748b' },

  // Section
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  sectionCount: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },

  // List
  listContent: { paddingHorizontal: 20, paddingBottom: 120, paddingTop: 4 },
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  listCardBody: { flex: 1, marginRight: 12 },
  listCardActions: { gap: 8 },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  badge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#475569', textTransform: 'uppercase' },
  metaText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  itemTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  itemDesc: { fontSize: 13, color: '#64748b', lineHeight: 18 },

  // Loading / Empty
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
  emptyBox: { paddingTop: 80, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#cbd5e1' },
  emptyDesc: { fontSize: 14, color: '#cbd5e1', textAlign: 'center' },

  // FAB
  fab: { position: 'absolute', bottom: 32, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },

  // Modal
  modal: { flex: 1, backgroundColor: '#ffffff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  modalSub: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  modalClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  modalBody: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  modalFooter: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },

  // Form
  formLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8, marginTop: 16 },
  required: { color: '#ef4444' },
  formInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, height: 52, fontSize: 15, color: '#0f172a' },
  formTextarea: { height: 110, paddingTop: 14, paddingBottom: 14 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  typeChipActive: { borderColor: '#0f172a', backgroundColor: '#0f172a' },
  typeChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  typeChipTextActive: { color: '#ffffff' },

  // Buttons
  cancelBtn: { flex: 1, height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  saveBtn: { flex: 2, height: 52, borderRadius: 12, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  saveBtnOff: { backgroundColor: '#94a3b8' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
});
