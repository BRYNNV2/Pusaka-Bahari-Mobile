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
import { useTheme } from '@/contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import MapView, { Marker, MapPressEvent, UrlTile } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ─── Types ────────────────────────────────────────────────────────────────────
type TabId = 'dashboard' | 'artifacts' | 'catalogs' | 'gallery' | 'agenda' | 'books';

const TABS: { id: TabId; label: string; icon: string; table: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid',      table: ''               },
  { id: 'artifacts', label: 'Artefak',  icon: 'archive',  table: 'artifacts'      },
  { id: 'catalogs',  label: 'Katalog',  icon: 'book',     table: 'catalogs'       },
  { id: 'gallery',   label: 'Galeri',   icon: 'image',    table: 'gallery_items'  },
  { id: 'agenda',    label: 'Agenda',   icon: 'calendar', table: 'agenda'         },
  { id: 'books',     label: 'Buku',     icon: 'book-open', table: 'books'          },
];

const TYPE_OPTIONS = ['Artefak', 'Naskah', 'Monumen', 'Benda'];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { mode, isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [data, setData]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem]   = useState<any | null>(null);
  const [stats, setStats]               = useState<Record<TabId, number>>({
    dashboard: 0, artifacts: 0, catalogs: 0, gallery: 0, agenda: 0, books: 0,
  });

  // ── Form Fields ──────────────────────────────────────────────────────────────
  // Catalogs
  const [cType, setCType] = useState('Benda');
  const [cName, setCName] = useState('');
  const [cYear, setCYear] = useState('');
  const [cLocation, setCLocation] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cImageUri, setCImageUri] = useState<string | null>(null);
  const [cImageUrl, setCImageUrl] = useState<string | null>(null);
  const [uploadingCImg, setUploadingCImg] = useState(false);

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
  const [pendingGalleryItem, setPendingGalleryItem] = useState<{ uri: string, type: 'image'|'audio', ext: string, title: string, desc: string, lyrics: string } | null>(null);
  const [editingGalleryItem, setEditingGalleryItem] = useState<any | null>(null);
  // Gallery (standalone tab)
  const [gTitle, setGTitle] = useState('');
  const [gDesc,  setGDesc]  = useState('');
  const [gAudio, setGAudio] = useState('');
  const [gOrder, setGOrder] = useState('0');
  const [gImageUri, setGImageUri] = useState<string | null>(null);
  const [gImageUrl, setGImageUrl] = useState<string | null>(null);
  const [uploadingGImg, setUploadingGImg] = useState(false);
  const [gLyrics, setGLyrics] = useState('');
  const [gVideoUrl, setGVideoUrl] = useState('');
  const [gMediaType, setGMediaType] = useState<'photo' | 'video' | 'audio'>('photo');
  // Agenda
  const [agTitle, setAgTitle] = useState('');
  const [agDesc,  setAgDesc]  = useState('');
  const [agDate,  setAgDate]  = useState('');
  const [agImageUri, setAgImageUri] = useState<string | null>(null);
  const [agImageUrl, setAgImageUrl] = useState<string | null>(null);
  const [uploadingAgImg, setUploadingAgImg] = useState(false);
  // Musics
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mAudioUrl, setMAudioUrl] = useState<string | null>(null);
  const [mAudioUri, setMAudioUri] = useState<string | null>(null);
  const [mImageUrl, setMImageUrl] = useState<string | null>(null);
  const [mImageUri, setMImageUri] = useState<string | null>(null);
  const [mLyrics, setMLyrics] = useState('');
  const [uploadingMImg, setUploadingMImg] = useState(false);
  const [uploadingMAudio, setUploadingMAudio] = useState(false);
  // Books
  const [bTitle, setBTitle] = useState('');
  const [bAuthor, setBAuthor] = useState('');
  const [bDesc, setBDesc] = useState('');
  const [bCoverUri, setBCoverUri] = useState<string | null>(null);
  const [bCoverUrl, setBCoverUrl] = useState<string | null>(null);
  const [bFileUrl, setBFileUrl] = useState<string | null>(null);
  const [bFileType, setBFileType] = useState('pdf');
  const [uploadingBCover, setUploadingBCover] = useState(false);
  const [uploadingBFile, setUploadingBFile] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const currentTab = TABS.find(t => t.id === activeTab)!;

  const fetchData = useCallback(async () => {
    if (activeTab === 'dashboard') {
      setData([]);
      return;
    }
    setLoading(true);
    const { data: rows } = await supabase
      .from(currentTab.table)
      .select('*')
      .order('id', { ascending: false });
    setData(rows ?? []);
    setLoading(false);
  }, [activeTab, currentTab]);

  const fetchStats = useCallback(async () => {
    const dataTabs = TABS.filter(t => t.id !== 'dashboard');
    const results = await Promise.all(
      dataTabs.map(tab =>
        supabase.from(tab.table).select('id', { count: 'exact', head: true })
      )
    );
    const newStats: Record<TabId, number> = { dashboard: 0, artifacts: 0, catalogs: 0, gallery: 0, agenda: 0, books: 0 };
    dataTabs.forEach((tab, i) => {
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
      setPendingGalleryItem({ uri, type: 'image', ext, title: '', desc: '', lyrics: '' });
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
      setPendingGalleryItem({ uri, type: 'audio', ext, title: '', desc: '', lyrics: '' });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const submitPendingGalleryItem = async (artifactId: number) => {
    if (!pendingGalleryItem) return;
    try {
      setUploadingGalleryItem(true);
      const { uri, type, ext, title, desc, lyrics } = pendingGalleryItem;
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
        lyrics: type === 'audio' && lyrics.trim() ? lyrics.trim() : null,
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
    Alert.alert('Hapus Item', 'Yakin ingin menghapus item galeri ini?', [
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

  const editGalleryItem = (item: any) => {
    setEditingGalleryItem({
      ...item,
      title: item.title || '',
      description: item.description || '',
      lyrics: item.lyrics || '',
      newImageUri: null, // for replacing photo
    });
  };

  const replaceGalleryImage = async () => {
    if (!editingGalleryItem) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Izin Ditolak', 'Butuh izin akses galeri foto.');
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (result.canceled || !result.assets[0]) return;
      setEditingGalleryItem({ ...editingGalleryItem, newImageUri: result.assets[0].uri });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const updateGalleryItem = async (artifactId: number) => {
    if (!editingGalleryItem) return;
    try {
      setUploadingGalleryItem(true);
      let newImageUrl = editingGalleryItem.image_url;

      // If user chose a new image, upload it
      if (editingGalleryItem.newImageUri) {
        const uri = editingGalleryItem.newImageUri;
        const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `items/${artifactId}_image_${Date.now()}.${ext}`;
        const formData = new FormData();
        formData.append('files', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          name: `gallery_replace_${Date.now()}.${ext}`,
          type: `image/${ext}`,
        } as any);
        const { error: uploadErr } = await supabase.storage.from('gallery').upload(path, formData, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(path);
        newImageUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('gallery_items')
        .update({
          title: editingGalleryItem.title.trim(),
          description: editingGalleryItem.description?.trim() || '',
          lyrics: editingGalleryItem.lyrics?.trim() || '',
          image_url: newImageUrl,
        })
        .eq('id', editingGalleryItem.id);
      if (error) throw error;
      Alert.alert('Berhasil', 'Item galeri berhasil diperbarui!');
      setEditingGalleryItem(null);
      fetchArtifactGallery(artifactId);
    } catch (e: any) {
      Alert.alert('Gagal', e.message);
    } finally {
      setUploadingGalleryItem(false);
    }
  };

  // ── Form ─────────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setAType('Artefak'); setAName(''); setAYear(''); setADesc(''); setAOpenHours(''); setAImageUri(null); setAImageUrl(null); setALat(null); setALng(null);
    setArtifactGallery([]);
    setCType('Benda'); setCName(''); setCYear(''); setCLocation(''); setCDesc(''); setCImageUri(null); setCImageUrl(null);
    setGTitle(''); setGDesc(''); setGAudio(''); setGOrder('0'); setGImageUri(null); setGImageUrl(null); setGLyrics(''); setGVideoUrl(''); setGMediaType('photo');
    setAgTitle(''); setAgDesc(''); setAgDate(''); setAgImageUri(null); setAgImageUrl(null);
    setMTitle(''); setMDesc(''); setMAudioUrl(null); setMAudioUri(null); setMImageUrl(null); setMImageUri(null); setMLyrics('');
    setBTitle(''); setBAuthor(''); setBDesc(''); setBCoverUri(null); setBCoverUrl(null); setBFileUrl(null); setBFileType('pdf');
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
    } else if (activeTab === 'catalogs') {
      setCType(item.type ?? 'Benda'); setCName(item.name ?? '');
      setCYear(item.year ?? '');      setCLocation(item.location ?? ''); 
      setCDesc(item.description ?? '');
      setCImageUri(item.image_url ?? null); setCImageUrl(item.image_url ?? null);
    } else if (activeTab === 'gallery') {
      setGTitle(item.title ?? '');     setGDesc(item.description ?? '');
      setGAudio(item.audio_url ?? ''); setGOrder(String(item.sort_order ?? 0));
      setGImageUri(item.image_url ?? null); setGImageUrl(item.image_url ?? null);
      setGLyrics(item.lyrics ?? '');
      setGVideoUrl(item.video_url ?? '');
      if (item.audio_url) setGMediaType('audio');
      else if (item.video_url) setGMediaType('video');
      else setGMediaType('photo');
    } else if (activeTab === 'agenda') {
      setAgTitle(item.title ?? '');    setAgDesc(item.description ?? '');
      setAgDate(item.event_date ?? '');
      setAgImageUri(item.image_url ?? null); setAgImageUrl(item.image_url ?? null);
    } else if (activeTab === 'books') {
      setBTitle(item.title ?? ''); setBAuthor(item.author ?? '');
      setBDesc(item.description ?? '');
      setBCoverUri(item.cover_url ?? null); setBCoverUrl(item.cover_url ?? null);
      setBFileUrl(item.file_url ?? null); setBFileType(item.file_type ?? 'pdf');
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
    if (activeTab === 'catalogs') {
      if (!cName.trim()) return null;
      return { 
        type: cType, 
        name: cName.trim(), 
        year: cYear.trim() || null, 
        location: cLocation.trim() || null,
        description: cDesc.trim() || null,
        image_url: cImageUrl || null,
      };
    }
    if (activeTab === 'gallery') {
      if (!gTitle.trim()) return null;
      return { 
        title: gTitle.trim(), 
        description: gDesc.trim() || '', 
        audio_url: gAudio.trim() || '', 
        lyrics: gLyrics.trim() || '',
        sort_order: gOrder.trim() ? parseInt(gOrder) : 0,
        image_url: gImageUrl || '',
        video_url: gVideoUrl.trim() || '',
      };
    }
    if (activeTab === 'agenda') {
      if (!agTitle.trim()) return null;
      return { 
        title: agTitle.trim(), 
        description: agDesc.trim() || null, 
        event_date: agDate.trim() || null,
        image_url: agImageUrl || null,
      };
    }
    if (activeTab === 'books') {
      if (!bTitle.trim()) return null;
      return {
        title: bTitle.trim(),
        author: bAuthor.trim() || null,
        description: bDesc.trim() || null,
        cover_url: bCoverUrl || null,
        file_url: bFileUrl || null,
        file_type: bFileType || 'pdf',
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

  const pickAndUploadVideo = async (
    bucket: string,
    folder: string,
    setUrl: (u: string) => void,
    setUploading: (b: boolean) => void,
  ) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Izin Ditolak', 'Butuh izin akses galeri video.');

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      });

      if (result.canceled || !result.assets[0]) return;
      const uri = result.assets[0].uri;
      setUploading(true);

      const ext  = uri.split('.').pop()?.toLowerCase() || 'mp4';
      const path = `${folder}/vid_${Date.now()}.${ext}`;
      const formData = new FormData();
      formData.append('files', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: `upload_${Date.now()}.${ext}`,
        type: `video/${ext}`,
      } as any);

      const { error } = await supabase.storage.from(bucket).upload(path, formData, { upsert: true });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      setUrl(urlData.publicUrl);
    } catch (e: any) {
      Alert.alert('Gagal Upload Video', e.message);
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
      // Auto-insert notifikasi untuk data baru (bukan edit)
      if (!editingItem) {
        const notifTitle = formData.name || formData.title || 'Data Baru';
        const notifTypeMap: Record<string, string> = {
          artifacts: 'artifact',
          catalogs: 'catalog',
          gallery: 'info',
          agenda: 'agenda',
          books: 'catalog',
        };
        const notifMessageMap: Record<string, string> = {
          artifacts: `Artefak baru "${notifTitle}" telah ditambahkan ke koleksi.`,
          catalogs: `Katalog baru "${notifTitle}" telah tersedia.`,
          gallery: `Media galeri baru "${notifTitle}" telah diunggah.`,
          agenda: `Agenda baru "${notifTitle}" telah dijadwalkan.`,
          books: `Buku baru "${notifTitle}" telah ditambahkan ke perpustakaan.`,
        };
        await supabase.from('notifications').insert([{
          title: `${activeTab === 'artifacts' ? '📜' : activeTab === 'agenda' ? '📅' : activeTab === 'catalogs' ? '📖' : activeTab === 'gallery' ? '🖼️' : activeTab === 'books' ? '📚' : '🔔'} ${notifTitle}`,
          message: notifMessageMap[activeTab] || `Data baru telah ditambahkan.`,
          type: notifTypeMap[activeTab] || 'info',
        }]);
      }
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
    if (activeTab === 'catalogs') return (
      <>
        <View style={styles.itemRow}>
          <View style={styles.badge}><Text style={styles.badgeText}>{item.type}</Text></View>
          <Text style={styles.metaText}>{item.year}</Text>
        </View>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
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
    if (activeTab === 'books') return (
      <>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDesc} numberOfLines={1}>{item.author ? `oleh ${item.author}` : 'Penulis tidak diketahui'}</Text>
        <Text style={styles.metaText}>📄 {item.file_url ? `File ${(item.file_type || 'pdf').toUpperCase()} tersedia` : 'Belum ada file'}</Text>
      </>
    );
    return null;
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.listCard}>
      <View style={styles.listCardBody}>{renderItemMeta(item)}</View>
      <View style={styles.listCardActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
          <Feather name="edit-2" size={15} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Feather name="trash-2" size={15} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderForm = () => {
    if (activeTab === 'catalogs') return (
      <>
        <Text style={styles.formLabel}>Kategori / Tipe</Text>
        <View style={styles.typeRow}>
          {['Benda', 'Tradisi', 'Naskah', 'Monumen'].map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.typeChip, cType === opt && styles.typeChipActive]}
              onPress={() => setCType(opt)}
            >
              <Text style={[styles.typeChipText, cType === opt && styles.typeChipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.formLabel}>Foto Ilustrasi</Text>
        <TouchableOpacity
          style={styles.imgPicker}
          activeOpacity={0.8}
          onPress={() => pickAndUploadImage('gallery', 'catalogs', setCImageUri, setCImageUrl, setUploadingCImg)}
        >
          {cImageUri ? (
            <Image source={{ uri: cImageUri }} style={styles.imgPreview} resizeMode="cover" />
          ) : (
            <View style={styles.imgPlaceholder}>
              <Feather name="image" size={28} color={colors.textSecondary} />
              <Text style={styles.imgPlaceholderText}>Ketuk untuk pilih foto</Text>
            </View>
          )}
          {uploadingCImg && (
            <View style={styles.imgOverlay}>
              <ActivityIndicator color={colors.card} />
              <Text style={{ color: "#ffffff", fontSize: 12, marginTop: 6 }}>Mengupload...</Text>
            </View>
          )}
        </TouchableOpacity>
        {cImageUrl && <Text style={styles.imgSuccess}>✓ Foto berhasil diupload</Text>}

        <Text style={styles.formLabel}>Nama Pusaka / Tradisi <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.formInput} value={cName} onChangeText={setCName} placeholder="cth: Perahu Jong" placeholderTextColor={colors.textSecondary} />
        <Text style={styles.formLabel}>Tahun / Era</Text>
        <TextInput style={styles.formInput} value={cYear} onChangeText={setCYear} placeholder="cth: Tradisional atau Abad 18" placeholderTextColor={colors.textSecondary} />
        <Text style={styles.formLabel}>Lokasi Penyimpanan</Text>
        <TextInput style={styles.formInput} value={cLocation} onChangeText={setCLocation} placeholder="cth: Museum Bahari atau Koleksi Pribadi" placeholderTextColor={colors.textSecondary} />
        <Text style={styles.formLabel}>Deskripsi Lengkap</Text>
        <TextInput style={[styles.formInput, styles.formTextarea]} value={cDesc} onChangeText={setCDesc} placeholder="Tuliskan sejarah dan deskripsinya..." placeholderTextColor={colors.textSecondary} multiline numberOfLines={5} textAlignVertical="top" />
      </>
    );
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
              <Feather name="image" size={28} color={colors.textSecondary} />
              <Text style={styles.imgPlaceholderText}>Ketuk untuk pilih foto</Text>
            </View>
          )}
          {uploadingAImg && (
            <View style={styles.imgOverlay}>
              <ActivityIndicator color={colors.card} />
              <Text style={{ color: "#ffffff", fontSize: 12, marginTop: 6 }}>Mengupload...</Text>
            </View>
          )}
        </TouchableOpacity>
        {aImageUrl && <Text style={styles.imgSuccess}>✓ Foto berhasil diupload</Text>}

        <Text style={styles.formLabel}>Nama Artefak <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.formInput} value={aName} onChangeText={setAName} placeholder="Nama artefak..." placeholderTextColor={colors.textSecondary} />
        <Text style={styles.formLabel}>Tahun</Text>
        <TextInput style={styles.formInput} value={aYear} onChangeText={setAYear} placeholder="cth: 1847" placeholderTextColor={colors.textSecondary} />
        <Text style={styles.formLabel}>Deskripsi</Text>
        <TextInput style={[styles.formInput, styles.formTextarea]} value={aDesc} onChangeText={setADesc} placeholder="Deskripsi singkat..." placeholderTextColor={colors.textSecondary} multiline numberOfLines={4} textAlignVertical="top" />
        
        <Text style={styles.formLabel}>Jadwal Operasional / Waktu Buka (Opsional)</Text>
        <TextInput style={styles.formInput} value={aOpenHours} onChangeText={setAOpenHours} placeholder="cth: Buka 24 Jam atau 08:00 - 17:00" placeholderTextColor={colors.textSecondary} />

        {/* ── Map Picker untuk Koordinat ── */}
        <Text style={styles.formLabel}>Lokasi di Peta</Text>
        <Text style={styles.mapPickerHint}>
          <Ionicons name="information-circle-outline" size={13} color={colors.textSecondary} />
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
            mapType={Platform.OS === 'android' ? 'none' : 'standard'}
          >
            {Platform.OS === 'android' && (
              <UrlTile
                urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
                maximumZ={19}
                flipY={false}
              />
            )}
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
          <Text style={[styles.metaText, { marginTop: 8, color: colors.textSecondary }]}>Belum ada koordinat dipilih</Text>
        )}

        {/* ── Galeri & Media untuk Artefak ini ── */}
        {editingItem && (
          <>
            <View style={styles.gallerySectionDivider} />
            <Text style={styles.gallerySectionTitle}>
              <Feather name="image" size={16} color={colors.text} /> Galeri & Media
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
                      <View style={[styles.galleryItemImg, { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }]}>
                        <Feather name="music" size={20} color={colors.textSecondary} />
                      </View>
                    )}
                    <Text style={styles.galleryItemTitle} numberOfLines={1}>{item.title}</Text>
                    {item.audio_url && (
                      <View style={styles.audioIndicator}>
                        <Feather name="headphones" size={10} color={colors.primary} />
                        <Text style={styles.audioIndicatorText}>Audio</Text>
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', position: 'absolute', top: 6, right: 6, gap: 4 }}>
                      <TouchableOpacity
                        style={[styles.galleryDeleteBtn, { backgroundColor: '#fdf4eb', right: undefined, position: 'relative' }]}
                        onPress={() => editGalleryItem(item)}
                      >
                        <Feather name="edit-2" size={12} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.galleryDeleteBtn, { position: 'relative' }]}
                        onPress={() => deleteGalleryItemById(item.id, editingItem.id)}
                      >
                        <Feather name="trash-2" size={12} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.galleryEmpty}>
                <Feather name="image" size={24} color="#cbd5e1" />
                <Text style={styles.galleryEmptyText}>Belum ada foto/media untuk artefak ini</Text>
              </View>
            )}

            {/* Edit Gallery Item Form */}
            {editingGalleryItem ? (
              <View style={{ backgroundColor: '#fdf4eb', padding: 16, borderRadius: 16, marginTop: 12, borderWidth: 1, borderColor: '#e8cdb5' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#6b3a1f', marginBottom: 12 }}>
                  ✏️ Edit {editingGalleryItem.audio_url ? 'Audio' : 'Foto'}
                </Text>
                
                {editingGalleryItem.image_url || editingGalleryItem.newImageUri ? (
                  <View>
                    <Image source={{ uri: editingGalleryItem.newImageUri || editingGalleryItem.image_url }} style={{ width: '100%', height: 120, borderRadius: 10, marginBottom: 8 }} resizeMode="cover" />
                    <TouchableOpacity 
                      onPress={replaceGalleryImage}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fdf4eb', marginBottom: 12 }}
                    >
                      <Feather name="refresh-cw" size={14} color={colors.primary} />
                      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>Ganti Foto</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ width: '100%', height: 50, borderRadius: 10, backgroundColor: '#fdf4eb', alignItems: 'center', justifyContent: 'center', marginBottom: 12, flexDirection: 'row', gap: 8 }}>
                    <Feather name="music" size={16} color={colors.primary} />
                    <Text style={{ fontSize: 13, color: '#6b3a1f', fontWeight: '600' }}>File Audio</Text>
                  </View>
                )}

                <Text style={[styles.formLabel, { fontSize: 12 }]}>Judul</Text>
                <TextInput 
                  style={[styles.formInput, { paddingVertical: 8, fontSize: 13 }]} 
                  value={editingGalleryItem.title} 
                  onChangeText={val => setEditingGalleryItem({ ...editingGalleryItem, title: val })}
                  placeholder="Judul foto/audio" 
                  placeholderTextColor={colors.textSecondary} 
                />

                <Text style={[styles.formLabel, { fontSize: 12 }]}>Deskripsi</Text>
                <TextInput 
                  style={[styles.formInput, styles.formTextarea, { fontSize: 13, minHeight: 60 }]} 
                  value={editingGalleryItem.description} 
                  onChangeText={val => setEditingGalleryItem({ ...editingGalleryItem, description: val })}
                  placeholder="Deskripsi..." 
                  placeholderTextColor={colors.textSecondary} 
                  multiline 
                />

                {editingGalleryItem.audio_url && (
                  <>
                    <Text style={[styles.formLabel, { fontSize: 12 }]}>Lirik / Teks Narasi</Text>
                    <TextInput 
                      style={[styles.formInput, styles.formTextarea, { fontSize: 13, minHeight: 80 }]} 
                      value={editingGalleryItem.lyrics} 
                      onChangeText={val => setEditingGalleryItem({ ...editingGalleryItem, lyrics: val })}
                      placeholder="Lirik audio..." 
                      placeholderTextColor={colors.textSecondary} 
                      multiline 
                    />
                  </>
                )}

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <TouchableOpacity 
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.border, alignItems: 'center' }} 
                    onPress={() => setEditingGalleryItem(null)}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }} 
                    onPress={() => updateGalleryItem(editingItem.id)}
                    disabled={uploadingGalleryItem}
                  >
                    {uploadingGalleryItem ? (
                      <ActivityIndicator size="small" color={colors.card} />
                    ) : (
                      <>
                        <Feather name="check" size={16} color={colors.card} />
                        <Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff" }}>Perbarui</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* Pending Upload Form */}
            {pendingGalleryItem ? (
              <View style={{ backgroundColor: colors.backgroundSecondary, padding: 16, borderRadius: 16, marginTop: 12, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
                  Detail {pendingGalleryItem.type === 'image' ? 'Foto' : 'Audio'}
                </Text>
                
                {pendingGalleryItem.type === 'image' && (
                  <Image source={{ uri: pendingGalleryItem.uri }} style={{ width: '100%', height: 120, borderRadius: 10, marginBottom: 12 }} resizeMode="cover" />
                )}
                {pendingGalleryItem.type === 'audio' && (
                  <View style={{ width: '100%', height: 60, borderRadius: 10, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 12, flexDirection: 'row', gap: 8 }}>
                    <Feather name="music" size={18} color={colors.textSecondary} />
                    <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>File Audio Siap Diupload</Text>
                  </View>
                )}

                <Text style={[styles.formLabel, { fontSize: 12 }]}>Judul Foto/Audio</Text>
                <TextInput 
                  style={[styles.formInput, { paddingVertical: 8, fontSize: 13 }]} 
                  value={pendingGalleryItem.title} 
                  onChangeText={val => setPendingGalleryItem({ ...pendingGalleryItem, title: val })}
                  placeholder="Misal: Tampak Depan" 
                  placeholderTextColor={colors.textSecondary} 
                />

                <Text style={[styles.formLabel, { fontSize: 12 }]}>Deskripsi (Boleh Kosong)</Text>
                <TextInput 
                  style={[styles.formInput, styles.formTextarea, { fontSize: 13, minHeight: 60 }]} 
                  value={pendingGalleryItem.desc} 
                  onChangeText={val => setPendingGalleryItem({ ...pendingGalleryItem, desc: val })}
                  placeholder="Beri penjelasan tentang media ini..." 
                  placeholderTextColor={colors.textSecondary} 
                  multiline 
                  numberOfLines={2} 
                />

                {pendingGalleryItem.type === 'audio' && (
                  <>
                    <Text style={[styles.formLabel, { fontSize: 12 }]}>Lirik / Teks Narasi (Opsional)</Text>
                    <TextInput 
                      style={[styles.formInput, styles.formTextarea, { fontSize: 13, minHeight: 80 }]} 
                      value={pendingGalleryItem.lyrics} 
                      onChangeText={val => setPendingGalleryItem({ ...pendingGalleryItem, lyrics: val })}
                      placeholder="Paste lirik di sini. Setiap baris akan berganti otomatis." 
                      placeholderTextColor={colors.textSecondary} 
                      multiline 
                      numberOfLines={4} 
                    />
                  </>
                )}

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <TouchableOpacity 
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.border, alignItems: 'center' }} 
                    onPress={() => setPendingGalleryItem(null)}
                    disabled={uploadingGalleryItem}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }} 
                    onPress={() => submitPendingGalleryItem(editingItem.id)}
                    disabled={uploadingGalleryItem}
                  >
                    {uploadingGalleryItem ? (
                      <ActivityIndicator size="small" color={colors.card} />
                    ) : (
                      <>
                        <Feather name="upload-cloud" size={16} color={colors.card} />
                        <Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff" }}>Simpan Media</Text>
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
                  <Feather name="camera" size={18} color={colors.text} />
                  <Text style={styles.addGalleryBtnText}>Tambah Foto Galeri</Text>
                </TouchableOpacity>

                {/* Add audio button */}
                <TouchableOpacity
                  style={[styles.addGalleryBtn, { borderColor: colors.primary, marginTop: 8 }]}
                  onPress={addAudioItemForArtifact}
                  activeOpacity={0.8}
                >
                  <Feather name="music" size={18} color={colors.primary} />
                  <Text style={[styles.addGalleryBtnText, { color: colors.primary }]}>Tambah Audio/Syair</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </>
    );



    if (activeTab === 'gallery') return (
      <>
        <Text style={styles.formLabel}>Pilih Tipe Media</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {(['photo', 'video', 'audio'] as const).map(type => (
            <TouchableOpacity 
              key={type}
              style={{
                flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8,
                backgroundColor: gMediaType === type ? colors.primary : colors.border,
                borderWidth: 1, borderColor: gMediaType === type ? colors.primary : colors.border
              }}
              onPress={() => setGMediaType(type)}
            >
              <Text style={{
                fontSize: 13, fontWeight: '600',
                color: gMediaType === type ? "#ffffff" : colors.textSecondary
              }}>
                {type === 'photo' ? 'Foto' : type === 'video' ? 'Video' : 'Audio'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.formLabel}>Judul <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.formInput} value={gTitle} onChangeText={setGTitle} placeholder="Judul item galeri..." placeholderTextColor={colors.textSecondary} />
        <Text style={styles.formLabel}>Deskripsi</Text>
        <TextInput style={[styles.formInput, styles.formTextarea]} value={gDesc} onChangeText={setGDesc} placeholder="Deskripsi..." placeholderTextColor={colors.textSecondary} multiline numberOfLines={3} textAlignVertical="top" />

        {gMediaType === 'photo' && (
          <>
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
                  <Feather name="image" size={28} color={colors.textSecondary} />
                  <Text style={styles.imgPlaceholderText}>Ketuk untuk pilih foto</Text>
                </View>
              )}
              {uploadingGImg && (
                <View style={styles.imgOverlay}>
                  <ActivityIndicator color={colors.card} />
                  <Text style={{ color: "#ffffff", fontSize: 12, marginTop: 6 }}>Mengupload...</Text>
                </View>
              )}
            </TouchableOpacity>
            {gImageUrl && <Text style={styles.imgSuccess}>✓ Foto berhasil diupload</Text>}
          </>
        )}

        {gMediaType === 'video' && (
          <>
            <Text style={styles.formLabel}>Sampul Video (Thumbnail)</Text>
            <TouchableOpacity
              style={styles.imgPicker}
              activeOpacity={0.8}
              onPress={() => pickAndUploadImage('gallery', 'items', setGImageUri, setGImageUrl, setUploadingGImg)}
            >
              {gImageUri ? (
                <Image source={{ uri: gImageUri }} style={styles.imgPreview} resizeMode="cover" />
              ) : (
                <View style={styles.imgPlaceholder}>
                  <Feather name="image" size={28} color={colors.textSecondary} />
                  <Text style={styles.imgPlaceholderText}>Ketuk untuk pilih sampul video</Text>
                </View>
              )}
              {uploadingGImg && (
                <View style={styles.imgOverlay}>
                  <ActivityIndicator color={colors.card} />
                  <Text style={{ color: "#ffffff", fontSize: 12, marginTop: 6 }}>Mengupload...</Text>
                </View>
              )}
            </TouchableOpacity>
            {gImageUrl && <Text style={styles.imgSuccess}>✓ Sampul berhasil diupload</Text>}

            <Text style={styles.formLabel}>Video (Link YouTube atau Upload MP4)</Text>
            <TextInput 
              style={styles.formInput} 
              value={gVideoUrl} 
              onChangeText={setGVideoUrl} 
              placeholder="Paste Link YouTube (https://...) atau" 
              placeholderTextColor={colors.textSecondary} 
            />
            <TouchableOpacity 
              style={[styles.addGalleryBtn, { marginTop: 4, marginBottom: 12 }]}
              onPress={() => pickAndUploadVideo('gallery', 'videos', setGVideoUrl, setUploadingGImg)}
            >
              <Feather name="video" size={18} color={colors.text} />
              <Text style={styles.addGalleryBtnText}>Upload File MP4</Text>
            </TouchableOpacity>
            {gVideoUrl && gVideoUrl.includes('supabase') && (
              <Text style={[styles.imgSuccess, { marginTop: -8 }]}>✓ Video MP4 diupload</Text>
            )}
            {uploadingGImg && <Text style={{ color: '#3b82f6', fontSize: 12, marginTop: -8 }}>Mengupload video...</Text>}
          </>
        )}

        {gMediaType === 'audio' && (
          <>
            <Text style={styles.formLabel}>File Audio (MP3)</Text>
            <TouchableOpacity
              style={[styles.imgPicker, { minHeight: 60 }]}
              activeOpacity={0.8}
              onPress={async () => {
                try {
                  const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
                  if (res.canceled || !res.assets[0]) return;
                  setUploadingGImg(true);
                  const uri = res.assets[0].uri;
                  const ext = res.assets[0].name.split('.').pop()?.toLowerCase() || 'mp3';
                  const path = `gallery_audio/${Date.now()}.${ext}`;
                  const formData = new FormData();
                  formData.append('files', {
                    uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                    name: `audio_${Date.now()}.${ext}`,
                    type: `audio/${ext}`,
                  } as any);
                  const { error } = await supabase.storage.from('gallery').upload(path, formData, { upsert: true });
                  if (error) throw error;
                  const { data } = supabase.storage.from('gallery').getPublicUrl(path);
                  setGAudio(data.publicUrl);
                  Alert.alert('Berhasil', 'Audio berhasil diunggah.');
                } catch (e: any) {
                  Alert.alert('Gagal Upload Audio', e.message);
                } finally {
                  setUploadingGImg(false);
                }
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Feather name="music" size={20} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, flex: 1 }}>
                  {gAudio ? '✓ Audio sudah diunggah. Ketuk untuk ganti.' : 'Ketuk untuk pilih file audio'}
                </Text>
              </View>
              {uploadingGImg && <ActivityIndicator color={colors.text} style={{ position: 'absolute', right: 20 }} />}
            </TouchableOpacity>

            <Text style={styles.formLabel}>Lirik/Syair (Opsional)</Text>
            <TextInput style={[styles.formInput, styles.formTextarea, { minHeight: 80 }]} value={gLyrics} onChangeText={setGLyrics} placeholder="Paste lirik di sini..." placeholderTextColor={colors.textSecondary} multiline numberOfLines={4} textAlignVertical="top" />
          </>
        )}

        <Text style={styles.formLabel}>Urutan Tampil</Text>
        <TextInput style={styles.formInput} value={gOrder} onChangeText={setGOrder} placeholder="0" placeholderTextColor={colors.textSecondary} keyboardType="numeric" />
      </>
    );

    if (activeTab === 'agenda') return (
      <>
        <Text style={styles.formLabel}>Poster Agenda (Opsional)</Text>
        <TouchableOpacity
          style={styles.imgPicker}
          activeOpacity={0.8}
          onPress={() => pickAndUploadImage('gallery', 'agenda_posters', setAgImageUri, setAgImageUrl, setUploadingAgImg)}
        >
          {agImageUri ? (
            <Image source={{ uri: agImageUri }} style={styles.imgPreview} resizeMode="cover" />
          ) : (
            <View style={styles.imgPlaceholder}>
              <Feather name="image" size={28} color={colors.textSecondary} />
              <Text style={styles.imgPlaceholderText}>Ketuk untuk pilih poster</Text>
            </View>
          )}
          {uploadingAgImg && (
            <View style={styles.imgOverlay}>
              <ActivityIndicator color={colors.card} />
              <Text style={{ color: "#ffffff", fontSize: 12, marginTop: 6 }}>Mengupload...</Text>
            </View>
          )}
        </TouchableOpacity>
        {agImageUrl && <Text style={styles.imgSuccess}>✓ Poster berhasil diupload</Text>}

        <Text style={styles.formLabel}>Nama Acara <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.formInput} value={agTitle} onChangeText={setAgTitle} placeholder="Nama acara budaya..." placeholderTextColor={colors.textSecondary} />
        <Text style={styles.formLabel}>Deskripsi</Text>
        <TextInput style={[styles.formInput, styles.formTextarea]} value={agDesc} onChangeText={setAgDesc} placeholder="Deskripsi acara..." placeholderTextColor={colors.textSecondary} multiline numberOfLines={3} textAlignVertical="top" />
        <Text style={styles.formLabel}>Tanggal (YYYY-MM-DD)</Text>
        <TextInput style={styles.formInput} value={agDate} onChangeText={setAgDate} placeholder="cth: 2026-10-25" placeholderTextColor={colors.textSecondary} />
      </>
    );

    if (activeTab === 'books') return (
      <>
        <Text style={styles.formLabel}>Cover Buku</Text>
        <TouchableOpacity
          style={styles.imgPicker}
          activeOpacity={0.8}
          onPress={() => pickAndUploadImage('gallery', 'books_covers', setBCoverUri, setBCoverUrl, setUploadingBCover)}
        >
          {bCoverUri ? (
            <Image source={{ uri: bCoverUri }} style={styles.imgPreview} resizeMode="cover" />
          ) : (
            <View style={styles.imgPlaceholder}>
              <Feather name="image" size={28} color={colors.textSecondary} />
              <Text style={styles.imgPlaceholderText}>Ketuk untuk pilih cover</Text>
            </View>
          )}
          {uploadingBCover && (
            <View style={styles.imgOverlay}>
              <ActivityIndicator color={colors.card} />
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.formLabel}>File Dokumen (PDF/EPUB/DOC) <Text style={styles.required}>*</Text></Text>
        <TouchableOpacity
          style={[styles.imgPicker, { minHeight: 60 }]}
          activeOpacity={0.8}
          onPress={async () => {
            try {
              const res = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/epub+zip', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '*/*'],
                copyToCacheDirectory: true,
              });
              if (res.canceled || !res.assets[0]) return;
              setUploadingBFile(true);
              const uri = res.assets[0].uri;
              const fileName = res.assets[0].name;
              const ext = fileName.split('.').pop()?.toLowerCase() || 'pdf';
              setBFileType(ext);
              const path = `books_files/${Date.now()}.${ext}`;
              const formData = new FormData();
              formData.append('files', {
                uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                name: `book_${Date.now()}.${ext}`,
                type: ext === 'pdf' ? 'application/pdf' : ext === 'epub' ? 'application/epub+zip' : 'application/octet-stream',
              } as any);
              const { error } = await supabase.storage.from('gallery').upload(path, formData, { upsert: true });
              if (error) throw error;
              const { data } = supabase.storage.from('gallery').getPublicUrl(path);
              setBFileUrl(data.publicUrl);
              Alert.alert('Berhasil', `File ${ext.toUpperCase()} berhasil diunggah.`);
            } catch (e: any) {
              Alert.alert('Gagal Upload File', e.message);
            } finally {
              setUploadingBFile(false);
            }
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Feather name="file-text" size={20} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, flex: 1 }}>
              {bFileUrl ? `✓ File ${bFileType.toUpperCase()} sudah diunggah. Ketuk untuk ganti.` : 'Ketuk untuk pilih file dokumen'}
            </Text>
          </View>
          {uploadingBFile && <ActivityIndicator color={colors.text} style={{ position: 'absolute', right: 20 }} />}
        </TouchableOpacity>

        <Text style={styles.formLabel}>Judul Buku <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.formInput} value={bTitle} onChangeText={setBTitle} placeholder="Judul buku..." placeholderTextColor={colors.textSecondary} />
        <Text style={styles.formLabel}>Penulis / Pengarang</Text>
        <TextInput style={styles.formInput} value={bAuthor} onChangeText={setBAuthor} placeholder="Nama penulis..." placeholderTextColor={colors.textSecondary} />
        <Text style={styles.formLabel}>Deskripsi / Sinopsis</Text>
        <TextInput style={[styles.formInput, styles.formTextarea]} value={bDesc} onChangeText={setBDesc} placeholder="Ringkasan isi buku..." placeholderTextColor={colors.textSecondary} multiline numberOfLines={4} textAlignVertical="top" />
      </>
    );

    return null;
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />

      {/* ── Header ── */}
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <Feather name="arrow-left" size={22} color={colors.text} />
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
              <Feather name={tab.icon as any} size={18} color={activeTab === tab.id ? colors.card : colors.textSecondary} />
              <Text style={[styles.statCount, activeTab === tab.id && { color: colors.card }]}>{stats[tab.id]}</Text>
              <Text style={[styles.statLabel, activeTab === tab.id && { color: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.8)' }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Section Label ── */}
        {activeTab !== 'dashboard' && (
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>Daftar {currentTab.label}</Text>
            <Text style={styles.sectionCount}>{data.length} item</Text>
          </View>
        )}
      </SafeAreaView>

      {/* ── Main Content ── */}
      {activeTab === 'dashboard' ? (
        <ScrollView contentContainerStyle={styles.dashboardContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.dashTitle}>Ringkasan Sistem</Text>
          <View style={styles.dashGrid}>
            {TABS.filter(t => t.id !== 'dashboard').map(tab => (
              <View key={tab.id} style={styles.dashCard}>
                <View style={styles.dashCardIcon}>
                  <Feather name={tab.icon as any} size={22} color={colors.primary} />
                </View>
                <Text style={styles.dashCardCount}>{stats[tab.id]}</Text>
                <Text style={styles.dashCardLabel}>Total {tab.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.dashChartSection}>
            <Text style={styles.dashTitle}>Proporsi Data Sistem</Text>
            <View style={{ marginTop: 10, gap: 16 }}>
              {TABS.filter(t => t.id !== 'dashboard').map(tab => {
                const maxVal = Math.max(...TABS.filter(t => t.id !== 'dashboard').map(t => stats[t.id] || 0), 1);
                const widthPct = ((stats[tab.id] || 0) / maxVal) * 100;
                return (
                  <View key={tab.id} style={{ flexDirection: 'column', gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' }}>
                          <Feather name={tab.icon as any} size={12} color={colors.primary} />
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>{tab.label}</Text>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{stats[tab.id]}</Text>
                    </View>
                    <View style={{ width: '100%', height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden' }}>
                      <LinearGradient
                        colors={['#d4af37', colors.primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ width: `${widthPct}%`, height: '100%', borderRadius: 5 }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      ) : loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.text} />
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
      {activeTab !== 'dashboard' && (
        <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.85}>
          <Feather name="plus" size={26} color={colors.card} />
        </TouchableOpacity>
      )}

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
                <Feather name="x" size={22} color={colors.text} />
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
const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  safeTop: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },

  // Stats
  statsRow: { paddingVertical: 12 },
  statCard: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.border, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14, minWidth: 84, gap: 4 },
  statCardActive: { backgroundColor: colors.text },
  statCount: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },

  // Section
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  sectionCount: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },

  // Dashboard Overview
  dashboardContainer: { padding: 20, paddingBottom: 100 },
  dashTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 16 },
  dashGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  dashCard: { width: (SCREEN_WIDTH - 54) / 2, backgroundColor: colors.card, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: colors.border },
  dashCardIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  dashCardCount: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 2 },
  dashCardLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  dashChartSection: { marginTop: 32, backgroundColor: colors.card, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: colors.border },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 180, marginTop: 10, paddingBottom: 24 },
  chartBarWrapper: { alignItems: 'center', width: 45, height: '100%', justifyContent: 'flex-end' },
  chartVal: { fontSize: 11, fontWeight: '700', color: colors.text, marginBottom: 6 },
  chartBarBg: { width: 32, flex: 1, backgroundColor: colors.border, borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  chartBarFill: { width: '100%', backgroundColor: colors.text, borderRadius: 8 },
  chartLabel: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, marginTop: 8, position: 'absolute', bottom: 0 },

  // List
  listContent: { paddingHorizontal: 20, paddingBottom: 120, paddingTop: 4 },
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  listCardBody: { flex: 1, marginRight: 12 },
  listCardActions: { gap: 8 },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  badge: { backgroundColor: colors.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  badgeText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  metaText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  itemTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  itemDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },

  // Loading / Empty
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  emptyBox: { paddingTop: 80, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.border },
  emptyDesc: { fontSize: 14, color: colors.border, textAlign: 'center' },

  // FAB
  fab: { position: 'absolute', bottom: 32, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center', shadowColor: colors.text, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },

  // Modal
  modal: { flex: 1, backgroundColor: colors.card },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  modalSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  modalClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  modalBody: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  modalFooter: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 16, gap: 12, borderTopWidth: 1, borderTopColor: colors.border },

  // Form
  formLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 16 },
  required: { color: '#ef4444' },
  formInput: { backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, height: 52, fontSize: 15, color: colors.text },
  formTextarea: { height: 110, paddingTop: 14, paddingBottom: 14 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSecondary },
  typeChipActive: { borderColor: colors.text, backgroundColor: colors.text },
  typeChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  typeChipTextActive: { color: colors.card },

  // Buttons
  cancelBtn: { flex: 1, height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  saveBtn: { flex: 2, height: 52, borderRadius: 12, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  saveBtnOff: { backgroundColor: colors.textSecondary },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: colors.card },

  // Image Picker
  imgPicker: { width: '100%', height: 180, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', overflow: 'hidden', backgroundColor: colors.backgroundSecondary },
  imgPreview: { width: '100%', height: '100%' },
  imgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imgPlaceholderText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  imgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  imgSuccess: { fontSize: 12, color: '#22c55e', fontWeight: '600', marginTop: 6 },

  // Map Picker
  mapPickerHint: { fontSize: 12, color: colors.textSecondary, marginBottom: 10, lineHeight: 18 },
  mapPickerContainer: { width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.border },
  mapPickerMap: { width: '100%', height: '100%' },
  mapPickerMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(15, 23, 42, 0.2)', alignItems: 'center', justifyContent: 'center' },
  mapPickerMarkerDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primary, borderWidth: 2, borderColor: "#ffffff" },
  coordResult: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0' },
  coordResultText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#166534' },

  // Artifact Gallery Management
  gallerySectionDivider: { height: 1, backgroundColor: colors.border, marginTop: 24, marginBottom: 8 },
  gallerySectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 12, marginBottom: 4 },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  galleryItemCard: { width: (SCREEN_WIDTH - 98) / 3, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border, position: 'relative' },
  galleryItemImg: { width: '100%', height: 80, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  galleryItemTitle: { fontSize: 10, fontWeight: '600', color: colors.text, paddingHorizontal: 6, paddingVertical: 4 },
  audioIndicator: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingBottom: 4 },
  audioIndicatorText: { fontSize: 9, color: colors.primary, fontWeight: '600' },
  galleryDeleteBtn: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  galleryEmpty: { alignItems: 'center', padding: 24, gap: 8, backgroundColor: colors.backgroundSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginTop: 8 },
  galleryEmptyText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  addGalleryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: colors.text, borderStyle: 'dashed' },
  addGalleryBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
});
