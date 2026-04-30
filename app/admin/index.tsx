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
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';

const SCREEN_WIDTH = Dimensions.get('window').width;

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
  const [aOpenHours, setAOpenHours] = useState('');
  const [aImageUri, setAImageUri] = useState<string | null>(null); // local uri preview
  const [aImageUrl, setAImageUrl] = useState<string | null>(null); // uploaded url
  const [uploadingAImg, setUploadingAImg] = useState(false);
  const [aLat, setALat] = useState<number | null>(null);
  const [aLng, setALng] = useState<number | null>(null);
  // Artifact Gallery Management
  const [artifactGallery, setArtifactGallery] = useState<any[]>([]);
  const [uploadingGalleryItem, setUploadingGalleryItem] = useState(false);
  const [pendingGalleryItem, setPendingGalleryItem] = useState<{ uri: string, type: 'image'|'audio', ext: string, title: string, desc: string } | null>(null);
  // Locations
  const [lTitle, setLTitle] = useState('');
  const [lDesc,  setLDesc]  = useState('');
  const [lLat,   setLLat]   = useState('');
  const [lLng,   setLLng]   = useState('');
  // Gallery (standalone tab)
  const [gTitle, setGTitle] = useState('');
  const [gDesc,  setGDesc]  = useState('');
  const [gAudio, setGAudio] = useState('');
  const [gOrder, setGOrder] = useState('0');
  const [gImageUri, setGImageUri] = useState<string | null>(null);
  const [gImageUrl, setGImageUrl] = useState<string | null>(null);
  const [uploadingGImg, setUploadingGImg] = useState(false);
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

  // ── Artifact Gallery Helpers ─────────────────────────────────────────────────
  const fetchArtifactGallery = async (artifactId: number) => {
    const { data } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('artifact_id', artifactId)
      .order('sort_order', { ascending: true });
    setArtifactGallery(data ?? []);
  };

  const addGalleryItemForArtifact = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Izin Ditolak', 'Butuh izin akses galeri foto.');

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (result.canceled || !result.assets[0]) return;

      const uri = result.assets[0].uri;
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      setPendingGalleryItem({ uri, type: 'image', ext, title: '', desc: '' });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const addAudioItemForArtifact = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) return;

      const uri = result.assets[0].uri;
      const ext = result.assets[0].name.split('.').pop()?.toLowerCase() || 'mp3';
      setPendingGalleryItem({ uri, type: 'audio', ext, title: '', desc: '' });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const submitPendingGalleryItem = async (artifactId: number) => {
    if (!pendingGalleryItem) return;
    try {
      setUploadingGalleryItem(true);
      const { uri, type, ext, title, desc } = pendingGalleryItem;
      const path = `items/${artifactId}_${type}_${Date.now()}.${ext}`;
      const formData = new FormData();
      formData.append('files', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: `gallery_${type}_${Date.now()}.${ext}`,
        type: `${type === 'image' ? 'image' : 'audio'}/${ext}`,
      } as any);

      const { error: uploadErr } = await supabase.storage.from('gallery').upload(path, formData, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(path);

      // Insert gallery item linked to this artifact
      const { error: insertErr } = await supabase.from('gallery_items').insert([{
        artifact_id: artifactId,
        title: title.trim() || (type === 'image' ? `Foto ${artifactGallery.length + 1}` : `Audio ${artifactGallery.length + 1}`),
        description: desc.trim() || (type === 'image' ? `Galeri foto artefak` : `Rekaman audio artefak`),
        image_url: type === 'image' ? urlData.publicUrl : '',
        audio_url: type === 'audio' ? urlData.publicUrl : '',
        sort_order: artifactGallery.length,
      }]);
      if (insertErr) throw insertErr;

      await fetchArtifactGallery(artifactId);
      Alert.alert('Berhasil', `${type === 'image' ? 'Foto' : 'Audio'} berhasil ditambahkan!`);
      setPendingGalleryItem(null);
    } catch (e: any) {
      Alert.alert('Gagal Upload', e.message);
    } finally {
      setUploadingGalleryItem(false);
    }
  };

  const deleteGalleryItemById = (itemId: number, artifactId: number) => {
    Alert.alert('Hapus Foto', 'Yakin ingin menghapus foto ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          await supabase.from('gallery_items').delete().eq('id', itemId);
          fetchArtifactGallery(artifactId);
        },
      },
    ]);
  };

  // ── Form ─────────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setAType('Artefak'); setAName(''); setAYear(''); setADesc(''); setAOpenHours(''); setAImageUri(null); setAImageUrl(null); setALat(null); setALng(null);
    setArtifactGallery([]);
    setLTitle(''); setLDesc(''); setLLat(''); setLLng('');
    setGTitle(''); setGDesc(''); setGAudio(''); setGOrder('0'); setGImageUri(null); setGImageUrl(null);
    setAgTitle(''); setAgDesc(''); setAgDate('');
    setEditingItem(null);
  };

  const openAdd = () => { resetForm(); setModalVisible(true); };

  const openEdit = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'artifacts') {
      setAType(item.type ?? 'Artefak'); setAName(item.name ?? '');
      setAYear(item.year ?? '');       setADesc(item.description ?? '');
      setAOpenHours(item.operational_hours ?? '');
      setAImageUri(item.image_url ?? null); setAImageUrl(item.image_url ?? null);
      setALat(item.latitude ?? null); setALng(item.longitude ?? null);
      fetchArtifactGallery(item.id);
    } else if (activeTab === 'locations') {
      setLTitle(item.title ?? '');     setLDesc(item.description ?? '');
      setLLat(String(item.latitude ?? '')); setLLng(String(item.longitude ?? ''));
    } else if (activeTab === 'gallery') {
      setGTitle(item.title ?? '');     setGDesc(item.description ?? '');
      setGAudio(item.audio_url ?? ''); setGOrder(String(item.sort_order ?? 0));
      setGImageUri(item.image_url ?? null); setGImageUrl(item.image_url ?? null);
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
        description: aDesc.trim() || null,
        operational_hours: aOpenHours.trim() || null,
        image_url: aImageUrl || null,
        latitude: aLat,
        longitude: aLng,
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
        sort_order: gOrder.trim() ? parseInt(gOrder) : 0,
        image_url: gImageUrl || null,
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

  // ── Image Upload Helpers ──────────────────────────────────────────────────────
  const pickAndUploadImage = async (
    bucket: string,
    folder: string,
    setUri: (u: string) => void,
    setUrl: (u: string) => void,
    setUploading: (b: boolean) => void,
  ) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Izin Ditolak', 'Butuh izin akses galeri foto.');

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (result.canceled || !result.assets[0]) return;
      const uri = result.assets[0].uri;
      setUri(uri);
      setUploading(true);

      const ext  = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${folder}/${Date.now()}.${ext}`;
      const formData = new FormData();
      formData.append('files', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: `upload_${Date.now()}.${ext}`,
        type: `image/${ext}`,
      } as any);

      const { error } = await supabase.storage.from(bucket).upload(path, formData, { upsert: true });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      setUrl(urlData.publicUrl);
    } catch (e: any) {
      Alert.alert('Gagal Upload', e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    // Validasi khusus untuk jadwal operasional
    if (activeTab === 'artifacts' && aOpenHours.trim()) {
      const hoursText = aOpenHours.trim();
      // Mengizinkan format waktu (08:00), kata "Jam", "Libur", atau "Tutup"
      const isValid = /([0-9]{1,2}[:.][0-9]{2})|([jJ]am)|([lL]ibur)|([tT]utup)/.test(hoursText);
      if (!isValid) {
        Alert.alert(
          'Format Tidak Sesuai', 
          'Jadwal operasional harus mengandung format waktu (cth: 08:00 - 17:00) atau kata "Jam", "Libur", "Tutup" (cth: Buka 24 Jam).'
        );
        return;
      }
    }

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
        {item.latitude && item.longitude ? (
          <Text style={styles.metaText}>📍 Koordinat tersimpan</Text>
        ) : (
          <Text style={[styles.metaText, { color: '#f59e0b' }]}>⚠️ Belum ada koordinat</Text>
        )}
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

        <Text style={styles.formLabel}>Foto Utama (Cover)</Text>
        <TouchableOpacity
          style={styles.imgPicker}
          activeOpacity={0.8}
          onPress={() => pickAndUploadImage('artifacts', 'covers', setAImageUri, setAImageUrl, setUploadingAImg)}
        >
          {aImageUri ? (
            <Image source={{ uri: aImageUri }} style={styles.imgPreview} resizeMode="cover" />
          ) : (
            <View style={styles.imgPlaceholder}>
              <Feather name="image" size={28} color="#94a3b8" />
              <Text style={styles.imgPlaceholderText}>Ketuk untuk pilih foto</Text>
            </View>
          )}
          {uploadingAImg && (
            <View style={styles.imgOverlay}>
              <ActivityIndicator color="#ffffff" />
              <Text style={{ color: '#fff', fontSize: 12, marginTop: 6 }}>Mengupload...</Text>
            </View>
          )}
        </TouchableOpacity>
        {aImageUrl && <Text style={styles.imgSuccess}>✓ Foto berhasil diupload</Text>}

        <Text style={styles.formLabel}>Nama Artefak <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.formInput} value={aName} onChangeText={setAName} placeholder="Nama artefak..." placeholderTextColor="#94a3b8" />
        <Text style={styles.formLabel}>Tahun</Text>
        <TextInput style={styles.formInput} value={aYear} onChangeText={setAYear} placeholder="cth: 1847" placeholderTextColor="#94a3b8" />
        <Text style={styles.formLabel}>Deskripsi</Text>
        <TextInput style={[styles.formInput, styles.formTextarea]} value={aDesc} onChangeText={setADesc} placeholder="Deskripsi singkat..." placeholderTextColor="#94a3b8" multiline numberOfLines={4} textAlignVertical="top" />
        
        <Text style={styles.formLabel}>Jadwal Operasional / Waktu Buka (Opsional)</Text>
        <TextInput style={styles.formInput} value={aOpenHours} onChangeText={setAOpenHours} placeholder="cth: Buka 24 Jam atau 08:00 - 17:00" placeholderTextColor="#94a3b8" />

        {/* ── Map Picker untuk Koordinat ── */}
        <Text style={styles.formLabel}>Lokasi di Peta</Text>
        <Text style={styles.mapPickerHint}>
          <Ionicons name="information-circle-outline" size={13} color="#64748b" />
          {' '}Ketuk pada peta untuk menandai lokasi artefak
        </Text>
        <View style={styles.mapPickerContainer}>
          <MapView
            style={styles.mapPickerMap}
            initialRegion={{
              latitude: aLat ?? 0.9255,
              longitude: aLng ?? 104.4170,
              latitudeDelta: 0.012,
              longitudeDelta: 0.012,
            }}
            onPress={(e: MapPressEvent) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setALat(latitude);
              setALng(longitude);
            }}
            mapType="standard"
          >
            {aLat !== null && aLng !== null && (
              <Marker coordinate={{ latitude: aLat, longitude: aLng }}>
                <View style={styles.mapPickerMarker}>
                  <View style={styles.mapPickerMarkerDot} />
                </View>
              </Marker>
            )}
          </MapView>
        </View>
        {aLat !== null && aLng !== null ? (
          <View style={styles.coordResult}>
            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            <Text style={styles.coordResultText}>
              {aLat.toFixed(6)}, {aLng.toFixed(6)}
            </Text>
            <TouchableOpacity onPress={() => { setALat(null); setALng(null); }}>
              <Feather name="x-circle" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={[styles.metaText, { marginTop: 8, color: '#94a3b8' }]}>Belum ada koordinat dipilih</Text>
        )}

        {/* ── Galeri & Media untuk Artefak ini ── */}
        {editingItem && (
          <>
            <View style={styles.gallerySectionDivider} />
            <Text style={styles.gallerySectionTitle}>
              <Feather name="image" size={16} color="#0f172a" /> Galeri & Media
            </Text>
            <Text style={styles.mapPickerHint}>
              Foto dan audio yang terkait dengan artefak ini. Galeri ini akan muncul di halaman detail artefak.
            </Text>

            {/* Existing gallery items */}
            {artifactGallery.length > 0 ? (
              <View style={styles.galleryGrid}>
                {artifactGallery.map(item => (
                  <View key={item.id} style={styles.galleryItemCard}>
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.galleryItemImg} resizeMode="cover" />
                    ) : (
                      <View style={[styles.galleryItemImg, { backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }]}>
                        <Feather name="music" size={20} color="#94a3b8" />
                      </View>
                    )}
                    <Text style={styles.galleryItemTitle} numberOfLines={1}>{item.title}</Text>
                    {item.audio_url && (
                      <View style={styles.audioIndicator}>
                        <Feather name="headphones" size={10} color="#3b82f6" />
                        <Text style={styles.audioIndicatorText}>Audio</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.galleryDeleteBtn}
                      onPress={() => deleteGalleryItemById(item.id, editingItem.id)}
                    >
                      <Feather name="trash-2" size={12} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.galleryEmpty}>
                <Feather name="image" size={24} color="#cbd5e1" />
                <Text style={styles.galleryEmptyText}>Belum ada foto/media untuk artefak ini</Text>
              </View>
            )}

            {/* Pending Upload Form */}
            {pendingGalleryItem ? (
              <View style={{ backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginTop: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>
                  Detail {pendingGalleryItem.type === 'image' ? 'Foto' : 'Audio'}
                </Text>
                
                {pendingGalleryItem.type === 'image' && (
                  <Image source={{ uri: pendingGalleryItem.uri }} style={{ width: '100%', height: 120, borderRadius: 10, marginBottom: 12 }} resizeMode="cover" />
                )}
                {pendingGalleryItem.type === 'audio' && (
                  <View style={{ width: '100%', height: 60, borderRadius: 10, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginBottom: 12, flexDirection: 'row', gap: 8 }}>
                    <Feather name="music" size={18} color="#64748b" />
                    <Text style={{ fontSize: 13, color: '#475569', fontWeight: '600' }}>File Audio Siap Diupload</Text>
                  </View>
                )}

                <Text style={[styles.formLabel, { fontSize: 12 }]}>Judul Foto/Audio</Text>
                <TextInput 
                  style={[styles.formInput, { paddingVertical: 8, fontSize: 13 }]} 
                  value={pendingGalleryItem.title} 
                  onChangeText={val => setPendingGalleryItem({ ...pendingGalleryItem, title: val })}
                  placeholder="Misal: Tampak Depan" 
                  placeholderTextColor="#94a3b8" 
                />

                <Text style={[styles.formLabel, { fontSize: 12 }]}>Deskripsi (Boleh Kosong)</Text>
                <TextInput 
                  style={[styles.formInput, styles.formTextarea, { fontSize: 13, minHeight: 60 }]} 
                  value={pendingGalleryItem.desc} 
                  onChangeText={val => setPendingGalleryItem({ ...pendingGalleryItem, desc: val })}
                  placeholder="Beri penjelasan tentang media ini..." 
                  placeholderTextColor="#94a3b8" 
                  multiline 
                  numberOfLines={2} 
                />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <TouchableOpacity 
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#e2e8f0', alignItems: 'center' }} 
                    onPress={() => setPendingGalleryItem(null)}
                    disabled={uploadingGalleryItem}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569' }}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#3b82f6', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }} 
                    onPress={() => submitPendingGalleryItem(editingItem.id)}
                    disabled={uploadingGalleryItem}
                  >
                    {uploadingGalleryItem ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Feather name="upload-cloud" size={16} color="#fff" />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Simpan Media</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {/* Add gallery button */}
                <TouchableOpacity
                  style={[styles.addGalleryBtn, { marginTop: 12 }]}
                  onPress={addGalleryItemForArtifact}
                  activeOpacity={0.8}
                >
                  <Feather name="camera" size={18} color="#0f172a" />
                  <Text style={styles.addGalleryBtnText}>Tambah Foto Galeri</Text>
                </TouchableOpacity>

                {/* Add audio button */}
                <TouchableOpacity
                  style={[styles.addGalleryBtn, { borderColor: '#3b82f6', marginTop: 8 }]}
                  onPress={addAudioItemForArtifact}
                  activeOpacity={0.8}
                >
                  <Feather name="music" size={18} color="#3b82f6" />
                  <Text style={[styles.addGalleryBtnText, { color: '#3b82f6' }]}>Tambah Audio/Syair</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
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

        <Text style={styles.formLabel}>Foto Galeri</Text>
        <TouchableOpacity
          style={styles.imgPicker}
          activeOpacity={0.8}
          onPress={() => pickAndUploadImage('gallery', 'items', setGImageUri, setGImageUrl, setUploadingGImg)}
        >
          {gImageUri ? (
            <Image source={{ uri: gImageUri }} style={styles.imgPreview} resizeMode="cover" />
          ) : (
            <View style={styles.imgPlaceholder}>
              <Feather name="image" size={28} color="#94a3b8" />
              <Text style={styles.imgPlaceholderText}>Ketuk untuk pilih foto</Text>
            </View>
          )}
          {uploadingGImg && (
            <View style={styles.imgOverlay}>
              <ActivityIndicator color="#ffffff" />
              <Text style={{ color: '#fff', fontSize: 12, marginTop: 6 }}>Mengupload...</Text>
            </View>
          )}
        </TouchableOpacity>
        {gImageUrl && <Text style={styles.imgSuccess}>✓ Foto berhasil diupload</Text>}

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

  // Image Picker
  imgPicker: { width: '100%', height: 180, borderRadius: 16, borderWidth: 1.5, borderColor: '#e2e8f0', borderStyle: 'dashed', overflow: 'hidden', backgroundColor: '#f8fafc' },
  imgPreview: { width: '100%', height: '100%' },
  imgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imgPlaceholderText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  imgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  imgSuccess: { fontSize: 12, color: '#22c55e', fontWeight: '600', marginTop: 6 },

  // Map Picker
  mapPickerHint: { fontSize: 12, color: '#64748b', marginBottom: 10, lineHeight: 18 },
  mapPickerContainer: { width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f1f5f9' },
  mapPickerMap: { width: '100%', height: '100%' },
  mapPickerMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(15, 23, 42, 0.2)', alignItems: 'center', justifyContent: 'center' },
  mapPickerMarkerDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#0f172a', borderWidth: 2, borderColor: '#ffffff' },
  coordResult: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0' },
  coordResultText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#166534' },

  // Artifact Gallery Management
  gallerySectionDivider: { height: 1, backgroundColor: '#e2e8f0', marginTop: 24, marginBottom: 8 },
  gallerySectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 12, marginBottom: 4 },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  galleryItemCard: { width: (SCREEN_WIDTH - 98) / 3, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', position: 'relative' },
  galleryItemImg: { width: '100%', height: 80, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  galleryItemTitle: { fontSize: 10, fontWeight: '600', color: '#0f172a', paddingHorizontal: 6, paddingVertical: 4 },
  audioIndicator: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingBottom: 4 },
  audioIndicatorText: { fontSize: 9, color: '#3b82f6', fontWeight: '600' },
  galleryDeleteBtn: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  galleryEmpty: { alignItems: 'center', padding: 24, gap: 8, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 8 },
  galleryEmptyText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  addGalleryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#0f172a', borderStyle: 'dashed' },
  addGalleryBtnText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
});
