import React, { useEffect, useState, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const TYPE_ICON: Record<string, string> = {
  Artefak: 'archive',
  Naskah:  'book-open',
  Monumen: 'grid',
  Benda:   'box',
};

const FALLBACK_IMAGE = require('../../assets/images/naskah_gurindam_1776493215711.png');
const FALLBACK_IMAGE2 = require('../../assets/images/masjid_penyengat_1776493242751.png');
const FALLBACK_IMAGE3 = require('../../assets/images/pusaka_bahari_banner_1776493187345.png');

export default function ArtifactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [artifact, setArtifact] = useState<any>(null);
  const [location, setLocation]   = useState<any>(null);
  const [gallery, setGallery]     = useState<any[]>([]);
  const [related, setRelated]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchAll();
  }, [id]);

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
      // Fetch related location (by artifact name keyword if exists)
      const { data: loc } = await supabase
        .from('map_locations')
        .select('*')
        .order('id', { ascending: true })
        .limit(1)
        .single();
      setLocation(loc ?? null);

      // Fetch gallery items
      const { data: gal } = await supabase
        .from('gallery_items')
        .select('*')
        .order('sort_order', { ascending: true })
        .limit(6);
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

  const handleShare = async () => {
    if (!artifact) return;
    await Share.share({
      message: `📜 ${artifact.name} — ${artifact.year ?? ''}\n\nWarisan bersejarah Raja Ali Haji dari Pusaka Bahari.\n${artifact.description ?? ''}`,
    });
  };

  const openMaps = () => {
    if (!location) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
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

  const galleryImages = [FALLBACK_IMAGE, FALLBACK_IMAGE2, FALLBACK_IMAGE3];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
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
            <Text style={styles.imageCounterText}>1 / {galleryImages.length}</Text>
          </View>

          {/* Floating Header Buttons */}
          <SafeAreaView edges={['top']} style={styles.floatingHeader}>
            <TouchableOpacity style={styles.floatBtn} onPress={() => router.back()}>
              <Feather name="arrow-left" size={20} color="#0f172a" />
            </TouchableOpacity>
            <View style={styles.floatRight}>
              <TouchableOpacity style={styles.floatBtn} onPress={handleShare}>
                <Feather name="share-2" size={20} color="#0f172a" />
              </TouchableOpacity>
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
                  {location?.title ?? 'Pulau Penyengat, Kepulauan Riau'}
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

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <ActionBtn icon="phone" label="Hubungi" onPress={() => {}} />
            <ActionBtn icon="map-pin" label="Lokasi" onPress={openMaps} />
            <ActionBtn icon="image" label="Galeri" onPress={() => router.push('/gallery')} />
            <ActionBtn icon="info" label="Info" onPress={() => {}} />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Open Status */}
          <View style={styles.openStatusRow}>
            <View style={styles.openDot} />
            <Text style={styles.openText}>Warisan Budaya Terbuka untuk Dikunjungi</Text>
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
              <AttributeItem icon="map" label="Lokasi" value="Pulau Penyengat" />
            </View>
          </View>

          {/* Photo Gallery Preview */}
          {galleryImages.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Galeri Foto</Text>
                <TouchableOpacity onPress={() => router.push('/gallery')}>
                  <Text style={styles.seeAll}>Lihat Semua</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryRow}>
                {galleryImages.map((src, i) => (
                  <TouchableOpacity key={i} activeOpacity={0.85} onPress={() => router.push('/gallery')}>
                    <Image source={require('../../assets/images/naskah_gurindam_1776493215711.png')} style={styles.galleryThumb} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
                {galleryImages.length >= 3 && (
                  <TouchableOpacity style={styles.moreThumb} onPress={() => router.push('/gallery')}>
                    <Text style={styles.moreThumbText}>+10</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
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
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function ActionBtn({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.actionIconWrap}>
        <Feather name={icon} size={18} color="#0f172a" />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

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

  // Actions
  actionRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  actionBtn:   { alignItems: 'center', gap: 6 },
  actionIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#475569' },

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
  galleryRow:      { paddingBottom: 4 },
  galleryThumb:    { width: 100, height: 80, borderRadius: 12, marginRight: 8 },
  moreThumb:       { width: 80, height: 80, borderRadius: 12, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  moreThumbText:   { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Related
  relatedGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  relatedCard:     { width: (width - 54) / 2, borderRadius: 14, overflow: 'hidden', backgroundColor: '#f8fafc' },
  relatedImage:    { width: '100%', height: 100 },
  relatedInfo:     { padding: 10 },
  relatedName:     { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  relatedYear:     { fontSize: 11, color: '#94a3b8', marginTop: 3 },
});
