import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Linking,
  Share,
  Alert,
  Modal,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import ImageViewing from 'react-native-image-viewing';

const { width, height } = Dimensions.get('window');

const TYPE_ICON: Record<string, string> = {
  Artefak: 'archive',
  Naskah:  'book-open',
  Monumen: 'grid',
  Benda:   'box',
};

const FALLBACK_IMAGE = require('../../assets/images/naskah_gurindam_1776493215711.jpg');
const FALLBACK_IMAGE2 = require('../../assets/images/masjid_penyengat_1776493242751.jpg');
const FALLBACK_IMAGE3 = require('../../assets/images/pusaka_bahari_banner_1776493187345.jpg');

export default function ArtifactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [artifact, setArtifact] = useState<any>(null);
  const [gallery, setGallery]     = useState<any[]>([]);
  const [related, setRelated]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded]   = useState(false);

  // Image Viewer State
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomImageUri, setZoomImageUri] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      fetchAll();
    }, [id])
  );

  const fetchAll = async () => {
    setLoading(true);
    // Fetch artifact
    const { data: art } = await supabase
      .from('artifacts')
      .select('*')
      .eq('id', id)
      .single();
    setArtifact(art);

    if (art) {
      // Fetch gallery items for THIS specific artifact
      const { data: gal } = await supabase
        .from('gallery_items')
        .select('*')
        .eq('artifact_id', id)
        .order('sort_order', { ascending: true });
      setGallery(gal ?? []);

      // Fetch related artifacts (same type, exclude self)
      const { data: rel } = await supabase
        .from('artifacts')
        .select('*')
        .eq('type', art.type)
        .neq('id', id)
        .limit(4);
      setRelated(rel ?? []);
    }

    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const handleShare = async () => {
    if (!artifact) return;
    await Share.share({
      message: `📜 ${artifact.name} — ${artifact.year ?? ''}\n\nWarisan bersejarah Raja Ali Haji dari Pusaka Bahari.\n${artifact.description ?? ''}`,
    });
  };

  const openMaps = () => {
    if (!artifact?.latitude || !artifact?.longitude) {
      Alert.alert('Lokasi Belum Tersedia', 'Koordinat untuk artefak ini belum ditambahkan oleh admin.');
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${artifact.latitude},${artifact.longitude}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#0f172a" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  if (!artifact) {
    return (
      <View style={styles.loadingScreen}>
        <Feather name="alert-circle" size={48} color="#cbd5e1" />
        <Text style={styles.loadingText}>Data tidak ditemukan.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnAlt}>
          <Text style={{ color: '#0f172a', fontWeight: '700' }}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const desc = artifact.description ?? 'Belum ada deskripsi untuk peninggalan bersejarah ini.';
  const shortDesc = desc.length > 180 ? desc.slice(0, 180) + '...' : desc;
  const typeIcon = (TYPE_ICON[artifact.type] ?? 'archive') as any;

  // Separate gallery items: images and audio
  const galleryPhotos = gallery.filter(g => g.image_url);
  const audioItems = gallery.filter(g => g.audio_url);

  // Format images for ImageViewing
  const formattedImages = galleryPhotos.map(photo => ({ uri: photo.image_url }));

  // Real-time Operational Hours logic
  let openStatusText = artifact.operational_hours || "Tersedia di Tempat Penyimpanan / Museum";
  let statusColor = "#f59e0b"; // Orange (default for objects/books)
  let isOpenNow: boolean | null = null;
  
  if (!artifact.operational_hours) {
    if (artifact.type === 'Monumen' || artifact.type === 'Situs') {
      openStatusText = "Terbuka 24 Jam (Area Publik)";
      statusColor = "#22c55e"; // Green
      isOpenNow = true;
    } else if (artifact.type === 'Bangunan') {
      openStatusText = "Buka Mengikuti Jadwal Operasional";
      statusColor = "#3b82f6"; // Blue
    }
  } else {
    // Parser Waktu Real-time (ala Google Maps)
    const hoursStr = artifact.operational_hours.toLowerCase();
    
    if (hoursStr.includes('24 jam')) {
      isOpenNow = true;
    } else if (hoursStr.includes('libur') || hoursStr.includes('tutup')) {
      isOpenNow = false; // Asumsi jika ada kata libur/tutup secara eksplisit
    } else {
      // Cari pola jam (contoh: 08:00 - 17:00 atau 08.00 - 17.00)
      const timeMatch = hoursStr.match(/(\d{1,2})[:.](\d{2})\s*-\s*(\d{1,2})[:.](\d{2})/);
      if (timeMatch) {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        
        const startMins = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
        const endMins = parseInt(timeMatch[3]) * 60 + parseInt(timeMatch[4]);
        
        // Cek apakah waktu saat ini berada di antara jam buka dan tutup
        if (currentMins >= startMins && currentMins <= endMins) {
          isOpenNow = true;
        } else {
          isOpenNow = false;
        }
      }
    }

    // Set warna dan format teks berdasarkan status real-time
    if (isOpenNow === true) {
      statusColor = "#22c55e"; // Green
      openStatusText = `Buka \u2022 ${artifact.operational_hours}`;
    } else if (isOpenNow === false) {
      statusColor = "#ef4444"; // Red
      openStatusText = `Tutup \u2022 ${artifact.operational_hours}`;
    } else {
      statusColor = "#22c55e"; // Fallback green
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        bounces={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" colors={['#0088CC']} progressViewOffset={40} />
        }
      >
        {/* ── Hero Image ── */}
        <View style={styles.heroContainer}>
          <Image
            source={artifact.image_url 
              ? { uri: artifact.image_url } 
              : artifact.type === 'Monumen' ? FALLBACK_IMAGE2 : FALLBACK_IMAGE
            }
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'transparent', 'rgba(0,0,0,0.3)']}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Image counter */}
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>1 / {galleryPhotos.length || 1}</Text>
          </View>

          {/* Floating Header Buttons */}
          <SafeAreaView edges={['top']} style={styles.floatingHeader}>
            <TouchableOpacity style={styles.floatBtn} onPress={() => router.back()}>
              <Feather name="arrow-left" size={20} color="#0f172a" />
            </TouchableOpacity>
            <View style={styles.floatRight}>
              <TouchableOpacity style={styles.floatBtn}>
                <Feather name="bookmark" size={20} color="#0f172a" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* ── Content Card ── */}
        <View style={styles.card}>

          {/* Title Row */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.artifactName}>{artifact.name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={14} color="#64748b" />
                <Text style={styles.locationText}>
                  {artifact.latitude && artifact.longitude
                    ? 'Pulau Penyengat, Kepulauan Riau'
                    : 'Lokasi belum ditandai'}
                </Text>
              </View>
            </View>
            <View style={styles.typeBadge}>
              <Feather name={typeIcon} size={13} color="#0f172a" />
              <Text style={styles.typeBadgeText}>{artifact.type}</Text>
            </View>
          </View>

          {/* Rating & Year Row */}
          <View style={styles.metaRow}>
            <View style={styles.ratingChip}>
              <Ionicons name="star" size={14} color="#f59e0b" />
              <Text style={styles.ratingVal}>5.0</Text>
              <Text style={styles.ratingCount}>(Raja Ali Haji)</Text>
            </View>
            {artifact.year ? (
              <View style={styles.yearChip}>
                <Feather name="clock" size={13} color="#475569" />
                <Text style={styles.yearText}>Tahun {artifact.year}</Text>
              </View>
            ) : null}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Premium Action Buttons */}
          <View style={styles.modernActionRow}>
            <TouchableOpacity style={styles.primaryAction} onPress={openMaps} activeOpacity={0.8}>
              <Feather name="map-pin" size={18} color="#ffffff" />
              <Text style={styles.primaryActionText}>Lihat di Peta</Text>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/gallery')} activeOpacity={0.8}>
                <Feather name="image" size={20} color="#0f172a" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleShare} activeOpacity={0.8}>
                <Feather name="share-2" size={20} color="#0f172a" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Open Status */}
          <View style={styles.openStatusRow}>
            <View style={[styles.openDot, { backgroundColor: statusColor }]} />
            <Text style={styles.openText}>{openStatusText}</Text>
            <Feather name="chevron-down" size={18} color="#64748b" />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deskripsi</Text>
            <Text style={styles.descText}>
              {expanded ? desc : shortDesc}
            </Text>
            {desc.length > 180 && (
              <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                <Text style={styles.readMore}>{expanded ? 'Sembunyikan' : 'Baca Selengkapnya'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Attributes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi</Text>
            <View style={styles.attributeGrid}>
              <AttributeItem icon="archive" label="Tipe" value={artifact.type} />
              <AttributeItem icon="calendar" label="Tahun" value={artifact.year ?? 'Tidak diketahui'} />
              <AttributeItem icon="user" label="Penulis" value="Raja Ali Haji" />
              <AttributeItem icon="map" label="Lokasi" value={artifact.latitude ? 'Koordinat Tersedia' : 'Belum ditandai'} />
            </View>
          </View>

          {/* Photo Gallery */}
          {galleryPhotos.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Galeri Foto</Text>
                <Text style={styles.seeAll}>{galleryPhotos.length} foto</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 4 }}>
                {galleryPhotos.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.85}
                    onPress={() => {
                      setCurrentImageIndex(index);
                      setIsImageViewVisible(true);
                    }}
                    style={styles.galleryCard}
                  >
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.galleryCardImg}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      locations={[0.5, 1]}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.galleryCardOverlay}>
                      <Text style={styles.galleryCardTitle} numberOfLines={1}>
                        {item.title || `Foto ${index + 1}`}
                      </Text>
                    </View>
                    <View style={styles.galleryZoomBadge}>
                      <Feather name="zoom-in" size={12} color="#ffffff" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Audio / Syair Section */}
          {audioItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎵 Syair & Audio</Text>
              {audioItems.map((item) => (
                <AudioPlayerCard
                  key={item.id}
                  title={item.title}
                  audioUrl={item.audio_url}
                  imageUrl={item.image_url}
                />
              ))}
            </View>
          )}

          {/* Empty gallery message */}
          {galleryPhotos.length === 0 && audioItems.length === 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Galeri & Media</Text>
              <View style={styles.emptyGallery}>
                <Feather name="image" size={28} color="#cbd5e1" />
                <Text style={styles.emptyGalleryText}>Belum ada foto atau audio untuk artefak ini</Text>
              </View>
            </View>
          )}

          {/* Related Artifacts */}
          {related.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Peninggalan Serupa</Text>
              <View style={styles.relatedGrid}>
                {related.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.relatedCard}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/artifact/${item.id}` as any)}
                  >
                    <Image
                      source={item.image_url 
                        ? { uri: item.image_url } 
                        : item.type === 'Monumen' ? FALLBACK_IMAGE2 : FALLBACK_IMAGE
                      }
                      style={styles.relatedImage}
                      resizeMode="cover"
                    />
                    <View style={styles.relatedInfo}>
                      <Text style={styles.relatedName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.relatedYear}>{item.year ?? 'Abad 19'}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      {/* Full-screen Photo Viewer (Premium Style) */}
      <Modal visible={isImageViewVisible} transparent={false} animationType="fade" onRequestClose={() => setIsImageViewVisible(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <StatusBar barStyle="light-content" />

          {/* Swipeable Photos */}
          <FlatList
            data={galleryPhotos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            initialScrollIndex={currentImageIndex}
            getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(newIndex);
            }}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={1} onPress={() => setZoomImageUri(item.image_url)}>
                <Image source={{ uri: item.image_url }} style={{ width, height }} resizeMode="cover" />
              </TouchableOpacity>
            )}
          />

          {/* Top Buttons */}
          <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 }}>
              <TouchableOpacity 
                onPress={() => setIsImageViewVisible(false)} 
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
              >
                <Feather name="chevron-left" size={22} color="#ffffff" />
              </TouchableOpacity>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, alignSelf: 'center' }}>
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }}>{currentImageIndex + 1} / {galleryPhotos.length}</Text>
              </View>
              <TouchableOpacity 
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
                onPress={() => setZoomImageUri(galleryPhotos[currentImageIndex]?.image_url)}
              >
                <Feather name="zoom-in" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Bottom Card Overlay */}
          <View style={styles.photoDetailCard}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: height * 0.45 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name="location" size={22} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '800' }} numberOfLines={2}>
                    {galleryPhotos[currentImageIndex]?.title || artifact?.name}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500', marginTop: 2 }}>
                    Pulau Penyengat, Kepulauan Riau
                  </Text>
                </View>
              </View>

              <View style={styles.photoStatsRow}>
                <View style={styles.photoStatItem}>
                  <Feather name="archive" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.photoStatText}>{artifact?.type}</Text>
                </View>
                <View style={styles.photoStatDivider} />
                <View style={styles.photoStatItem}>
                  <Feather name="calendar" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.photoStatText}>{artifact?.year || 'Abad 19'}</Text>
                </View>
                <View style={styles.photoStatDivider} />
                <View style={styles.photoStatItem}>
                  <Ionicons name="star" size={14} color="#fbbf24" />
                  <Text style={styles.photoStatText}>5.0</Text>
                </View>
              </View>

              <View style={{ marginTop: 16 }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Deskripsi</Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 22 }}>
                  {galleryPhotos[currentImageIndex]?.description || artifact?.description || 'Tidak ada deskripsi.'}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Zoom Lightbox */}
      <ImageViewing
        images={zoomImageUri ? [{ uri: zoomImageUri }] : []}
        imageIndex={0}
        visible={!!zoomImageUri}
        onRequestClose={() => setZoomImageUri(null)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
        backgroundColor="rgba(0, 0, 0, 0.9)"
      />
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function AttributeItem({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.attributeItem}>
      <View style={styles.attributeIconWrap}>
        <Feather name={icon} size={18} color="#0f172a" />
      </View>
      <Text style={styles.attributeLabel}>{label}</Text>
      <Text style={styles.attributeValue}>{value}</Text>
    </View>
  );
}

function AudioPlayerCard({ title, audioUrl, imageUrl }: { title: string; audioUrl: string; imageUrl?: string }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  async function togglePlay() {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
      return;
    }
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          newSound.setPositionAsync(0);
        }
      });
    } catch (e) {
      console.log('Error playing audio', e);
    }
  }

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  return (
    <View style={styles.audioCard}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.audioCardImg} resizeMode="cover" />
      ) : (
        <View style={[styles.audioCardImg, { backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }]}>
          <Feather name="music" size={20} color="#94a3b8" />
        </View>
      )}
      <View style={styles.audioCardInfo}>
        <Text style={styles.audioCardTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.audioCardSub}>Ketuk untuk {isPlaying ? 'jeda' : 'putar'}</Text>
      </View>
      <TouchableOpacity style={styles.audioPlayBtn} onPress={togglePlay}>
        <Feather name={isPlaying ? 'pause' : 'play'} size={16} color="#0f172a" style={isPlaying ? {} : { marginLeft: 2 }} />
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f8fafc' },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: '#f8fafc' },
  loadingText:  { fontSize: 15, color: '#94a3b8', fontWeight: '500' },
  backBtnAlt:   { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: '#f1f5f9' },

  // Hero
  heroContainer: { width, height: height * 0.38, position: 'relative' },
  heroImage:     { width: '100%', height: '100%' },
  imageCounter:  { position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  imageCounterText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  floatingHeader: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  floatBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  floatRight:    { flexDirection: 'row', gap: 10 },

  // Card
  card: { backgroundColor: '#ffffff', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -28, paddingHorizontal: 22, paddingTop: 24, minHeight: height * 0.7 },

  titleRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  artifactName:{ fontSize: 22, fontWeight: '800', color: '#0f172a', flex: 1, lineHeight: 28, letterSpacing: -0.5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText:{ fontSize: 13, color: '#64748b', fontWeight: '500' },
  typeBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  typeBadgeText:{ fontSize: 12, fontWeight: '700', color: '#0f172a' },

  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  ratingChip:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingVal:   { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  ratingCount: { fontSize: 13, color: '#94a3b8' },
  yearChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  yearText:    { fontSize: 12, fontWeight: '600', color: '#475569' },

  divider:     { height: 1, backgroundColor: '#f1f5f9', marginVertical: 14 },

  // Modern Premium Actions
  modernActionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  primaryAction:   { flex: 1, backgroundColor: '#0f172a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 8 },
  primaryActionText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  secondaryActions: { flexDirection: 'row', gap: 10 },
  secondaryBtn:    { width: 54, height: 54, backgroundColor: '#f1f5f9', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  // Open Status
  openStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  openDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  openText:      { flex: 1, fontSize: 13, color: '#0f172a', fontWeight: '600' },

  // Section
  section:         { marginBottom: 20 },
  sectionTitle:    { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 12, letterSpacing: -0.3 },
  sectionHeaderRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll:          { fontSize: 13, fontWeight: '600', color: '#0f172a', textDecorationLine: 'underline' },
  descText:        { fontSize: 14, color: '#475569', lineHeight: 22 },
  readMore:        { fontSize: 13, fontWeight: '700', color: '#0f172a', marginTop: 6 },

  // Attributes
  attributeGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  attributeItem:   { width: (width - 64) / 2, backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, gap: 6, borderWidth: 1, borderColor: '#f1f5f9' },
  attributeIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  attributeLabel:  { fontSize: 11, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' },
  attributeValue:  { fontSize: 14, fontWeight: '700', color: '#0f172a' },

  // Gallery
  galleryCard: {
    width: 180,
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f1f5f9',
  },
  galleryCardImg: {
    width: '100%',
    height: '100%',
  },
  galleryCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  galleryCardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  galleryZoomBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Audio Player
  audioCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  audioCardImg:    { width: 48, height: 48, borderRadius: 10 },
  audioCardInfo:   { flex: 1, paddingHorizontal: 12 },
  audioCardTitle:  { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  audioCardSub:    { fontSize: 12, color: '#94a3b8' },
  audioPlayBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },

  // Empty Gallery
  emptyGallery:    { alignItems: 'center', padding: 28, gap: 8, backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  emptyGalleryText:{ fontSize: 13, color: '#94a3b8', fontWeight: '500', textAlign: 'center' },

  // Related
  relatedGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  relatedCard:     { width: (width - 54) / 2, borderRadius: 14, overflow: 'hidden', backgroundColor: '#f8fafc' },
  relatedImage:    { width: '100%', height: 100 },
  relatedInfo:     { padding: 10 },
  relatedName:     { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  relatedYear:     { fontSize: 11, color: '#94a3b8', marginTop: 3 },

  // Image Viewer
  imageViewerFooter: { padding: 24, paddingBottom: 48, backgroundColor: 'rgba(0,0,0,0.4)' },
  imageViewerTitle:  { color: '#ffffff', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  imageViewerDesc:   { color: '#cbd5e1', fontSize: 13, lineHeight: 20 },

  // Photo Detail Modal
  photoDetailCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  photoStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  photoStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoStatText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  photoStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
