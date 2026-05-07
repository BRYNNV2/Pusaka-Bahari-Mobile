import { Feather, Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Image, ScrollView, StatusBar, StyleSheet, Text, 
  TouchableOpacity, View, Modal, Dimensions, Platform, ActivityIndicator,
  RefreshControl, LayoutAnimation, UIManager
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';
import ImageViewing from 'react-native-image-viewing';

const { width, height } = Dimensions.get('window');

const FALLBACK_IMAGE = require('../../assets/images/naskah_gurindam_1776493215711.jpg');

export default function GalleryScreen() {
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState<any>(null);
  
  // Playback state
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(1);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [playerTab, setPlayerTab] = useState<'next' | 'lyrics' | 'related'>('lyrics');

  // Eksplorasi Mendalam
  const [artifactsData, setArtifactsData] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [zoomImageUri, setZoomImageUri] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      fetchPlaylist();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchPlaylist(), fetchGalleryPhotos()]);
    setRefreshing(false);
  }, []);

  const fetchPlaylist = async () => {
    setIsLoading(true);
    // Mengambil item galeri yang memiliki audio_url, beserta data artefak induknya
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*, artifacts(name, image_url, description)')
      .not('audio_url', 'is', null)
      .neq('audio_url', '');

    if (data) {
      const formatted = data.map(item => ({
        id: item.id,
        artifactId: item.artifact_id, // Untuk fitur terkait
        title: item.title || item.artifacts?.name || 'Audio Tanpa Judul',
        desc: item.description || item.artifacts?.description || 'Tidak ada deskripsi',
        audioUrl: item.audio_url,
        img: item.image_url 
             ? { uri: item.image_url } 
             : (item.artifacts?.image_url ? { uri: item.artifacts.image_url } : FALLBACK_IMAGE),
        lyrics: item.lyrics 
             ? item.lyrics.split('\n').map((line: string, i: number) => ({ time: i * 3500, text: line })) 
             : [
                 { time: 0, text: "(Pemutaran Audio Dimulai...)" },
                 { time: 999999, text: "Lirik belum tersedia untuk audio ini." }
               ]
      }));
      setPlaylist(formatted);
    }
    setIsLoading(false);
  };

  const fetchGalleryPhotos = async () => {
    const { data } = await supabase
      .from('gallery_items')
      .select('*, artifacts(name, type, year, description)')
      .not('image_url', 'is', null)
      .neq('image_url', '')
      .order('id', { ascending: false });
    setArtifactsData(data || []);
  };

  useFocusEffect(
    useCallback(() => {
      fetchGalleryPhotos();
    }, [])
  );

  const playTrack = async (track: any) => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    setActiveTrack(track);
    setShowPlayer(true);
    setPositionMillis(0);
    setIsPlaying(false);

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.audioUrl },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setIsPlaying(false);
    } catch (e) {
      console.log('Error playing audio', e);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPositionMillis(status.positionMillis);
      if (status.durationMillis) {
        setDurationMillis(status.durationMillis);
      }
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  };

  const togglePlayPause = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  // Gunakan ref untuk state terbaru di cleanup useFocusEffect
  const soundRef = useRef<Audio.Sound | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  useEffect(() => {
    soundRef.current = sound;
    isPlayingRef.current = isPlaying;
  }, [sound, isPlaying]);

  useFocusEffect(
    useCallback(() => {
      // Pause audio saat screen blur (pindah tab)
      return () => {
        if (soundRef.current && isPlayingRef.current) {
          soundRef.current.pauseAsync().catch(() => {});
          setIsPlaying(false);
        }
      };
    }, [])
  );

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Find active lyric safely
  let activeLyricIndex = -1;
  if (activeTrack?.lyrics) {
    for (let i = activeTrack.lyrics.length - 1; i >= 0; i--) {
      if (positionMillis >= activeTrack.lyrics[i].time) {
        activeLyricIndex = i;
        break;
      }
    }
  }

  useEffect(() => {
    if (showPlayer && scrollViewRef.current && activeLyricIndex >= 0) {
      scrollViewRef.current.scrollTo({ 
        y: Math.max(0, (activeLyricIndex * 42) - 60), 
        animated: true 
      });
    }
  }, [activeLyricIndex, showPlayer, isExpanded, playerTab]);

  const progressPercent = Math.min((positionMillis / durationMillis) * 100, 100);

  const openExpandedView = (tab: 'next' | 'lyrics' | 'related') => {
    setPlayerTab(tab);
    setIsExpanded(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={showPlayer ? "light-content" : "dark-content"} />
      <SafeAreaView edges={['top']} style={{ flex: 0, backgroundColor: '#ffffff' }} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Galeri & Media</Text>
          <Text style={styles.headerDesc}>Dengarkan mahakarya & jelajahi koleksi foto pusaka.</Text>
        </View>

        <Text style={styles.sectionTitle}>Daftar Putar</Text>
        <View style={styles.audioList}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#0f172a" style={{ marginVertical: 20 }} />
          ) : playlist.length === 0 ? (
            <Text style={{ color: '#94a3b8', fontStyle: 'italic' }}>Belum ada audio yang diunggah.</Text>
          ) : (
            playlist.map(item => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.audioCard}
                onPress={() => playTrack(item)}
                activeOpacity={0.7}
              >
                <Image source={item.img} style={styles.audioThumb} />
                <View style={styles.audioInfo}>
                  <Text style={styles.audioTitle}>{item.title}</Text>
                  <Text style={styles.audioDesc}>{item.desc}</Text>
                </View>
                <View style={styles.playBtnSmall}>
                  <Feather name="play" size={16} color="#0f172a" style={{ marginLeft: 2 }} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Galeri Foto</Text>
        <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 16, paddingHorizontal: 20 }}>
          {artifactsData.length} koleksi foto naskah & artefak bersejarah
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 8 }}>
          {artifactsData.length === 0 ? (
            <View style={{ padding: 30, alignItems: 'center' }}>
              <Feather name="image" size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
              <Text style={{ color: '#94a3b8', fontStyle: 'italic' }}>Belum ada foto galeri.</Text>
            </View>
          ) : (
            artifactsData.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.photoCard}
                activeOpacity={0.85}
                onPress={() => setSelectedPhoto(item)}
              >
                <Image source={{ uri: item.image_url }} style={styles.exploreImg} />
                <LinearGradient 
                  colors={['transparent', 'rgba(0,0,0,0.75)']} 
                  locations={[0.4, 1]}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.exploreOverlay}>
                  <View style={styles.exploreTypeBadge}>
                    <Text style={styles.exploreTypeText}>{item.artifacts?.type || 'Foto'}</Text>
                  </View>
                  <Text style={styles.exploreName} numberOfLines={1}>{item.title || item.artifacts?.name || 'Tanpa Judul'}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* MODAL FOTO DETAIL */}
      {selectedPhoto && (
        <Modal visible={!!selectedPhoto} animationType="fade" transparent={false} onRequestClose={() => setSelectedPhoto(null)}>
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar barStyle="light-content" />
            
            {/* Full Background Image */}
            <Image 
              source={{ uri: selectedPhoto.image_url }} 
              style={{ width, height, position: 'absolute' }} 
              resizeMode="cover"
            />

            {/* Top Buttons */}
            <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 }}>
                <TouchableOpacity 
                  onPress={() => setSelectedPhoto(null)} 
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
                >
                  <Feather name="chevron-left" size={22} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setZoomImageUri(selectedPhoto.image_url)}
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
                >
                  <Feather name="zoom-in" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </SafeAreaView>

            {/* Bottom Card Overlay */}
            <View style={styles.photoDetailCard}>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: height * 0.45 }}>
                {/* Location Pin + Title */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="location" size={22} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '800' }} numberOfLines={2}>
                      {selectedPhoto.title || selectedPhoto.artifacts?.name || 'Tanpa Judul'}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500', marginTop: 2 }}>
                      Pulau Penyengat, Kepulauan Riau
                    </Text>
                  </View>
                </View>

                {/* Stats Row */}
                <View style={styles.photoStatsRow}>
                  <View style={styles.photoStatItem}>
                    <Feather name="archive" size={14} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.photoStatText}>{selectedPhoto.artifacts?.type || 'Foto'}</Text>
                  </View>
                  <View style={styles.photoStatDivider} />
                  <View style={styles.photoStatItem}>
                    <Feather name="calendar" size={14} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.photoStatText}>{selectedPhoto.artifacts?.year || 'Abad 19'}</Text>
                  </View>
                  <View style={styles.photoStatDivider} />
                  <View style={styles.photoStatItem}>
                    <Ionicons name="star" size={14} color="#fbbf24" />
                    <Text style={styles.photoStatText}>5.0</Text>
                  </View>
                </View>

                {/* Description */}
                <View style={{ marginTop: 16 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Deskripsi</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 22 }}>
                    {selectedPhoto.description || selectedPhoto.artifacts?.description || 'Tidak ada deskripsi untuk foto ini.'}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                  <TouchableOpacity 
                    onPress={() => setZoomImageUri(selectedPhoto.image_url)} 
                    style={[styles.photoCloseBtn, { flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' }]}
                    activeOpacity={0.8}
                  >
                    <Feather name="zoom-in" size={16} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>Perbesar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setSelectedPhoto(null)} 
                    style={[styles.photoCloseBtn, { flex: 1 }]}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>Tutup</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Zoom Lightbox */}
      <ImageViewing
        images={zoomImageUri ? [{ uri: zoomImageUri }] : []}
        imageIndex={0}
        visible={!!zoomImageUri}
        onRequestClose={() => setZoomImageUri(null)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
        backgroundColor="rgba(0, 0, 0, 0.95)"
      />

      {/* SPOTIFY-STYLE MUSIC PLAYER MODAL */}
      <Modal visible={showPlayer} animationType="slide" presentationStyle="fullScreen">
        <LinearGradient colors={['#334155', '#0f172a']} style={styles.playerContainer}>
          <SafeAreaView style={{flex: 1}}>
            {/* TAMPILAN PEMUTAR UTAMA (Normal) */}
            <View style={{ flex: 1 }}>
              
              {/* Header Utama */}
              <View style={styles.playerHeader}>
                <TouchableOpacity onPress={() => setShowPlayer(false)} style={styles.closeBtn}>
                  <Feather name="chevron-down" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.playerHeaderText}>SEDANG DIPUTAR</Text>
                <View style={{ width: 28 }} />
              </View>

              {/* Top Section (Art & Controls) - Centered Vertically */}
              <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 20 }}>
                {/* Album Art */}
                <View style={styles.albumArtContainer}>
                  <Image source={activeTrack?.img} style={styles.albumArtLarge} />
                </View>

                {/* Title & Desc */}
                <View style={styles.titleContainer}>
                  <Text style={styles.playerTitle}>{activeTrack?.title}</Text>
                  <Text style={styles.playerDesc} numberOfLines={1}>{activeTrack?.desc}</Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                  </View>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{formatTime(positionMillis)}</Text>
                    <Text style={styles.timeText}>{formatTime(durationMillis)}</Text>
                  </View>
                </View>

                {/* Controls */}
                <View style={styles.controlsContainer}>
                  <TouchableOpacity>
                    <Ionicons name="play-skip-back" size={32} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseBtnLarge}>
                    <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#0f172a" style={!isPlaying ? {marginLeft: 4} : {}} />
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Ionicons name="play-skip-forward" size={32} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Navigasi Bawah Ala Spotify (Klik untuk Expand) */}
              <View style={styles.bottomNavContainer}>
                <TouchableOpacity onPress={() => openExpandedView('next')} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={styles.bottomNavText}>Berikutnya</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openExpandedView('lyrics')} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={[styles.bottomNavText, { color: 'white', fontWeight: 'bold' }]}>Lirik</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openExpandedView('related')} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={styles.bottomNavText}>Terkait</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </Modal>

      {/* --- MODAL LIRIK FULL SCREEN (Animasi Slide Halus) --- */}
      <Modal visible={isExpanded} animationType="slide" presentationStyle="fullScreen">
        <LinearGradient colors={['#1e293b', '#0f172a']} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              {/* Header Mini */}
              <View style={styles.expandedHeader}>
                <TouchableOpacity onPress={() => setIsExpanded(false)} style={{ paddingRight: 16 }}>
                  <Feather name="chevron-down" size={28} color="white" />
                </TouchableOpacity>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={activeTrack?.img} style={{ width: 44, height: 44, borderRadius: 6 }} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }} numberOfLines={1}>{activeTrack?.title}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }} numberOfLines={1}>{activeTrack?.desc}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={togglePlayPause} style={{ paddingLeft: 16 }}>
                  <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="white" />
                </TouchableOpacity>
              </View>

              {/* Tab Menu */}
              <View style={styles.expandedTabs}>
                {(['next', 'lyrics', 'related'] as const).map(tab => (
                  <TouchableOpacity 
                    key={tab} 
                    onPress={() => setPlayerTab(tab)} 
                    style={[styles.expandedTab, playerTab === tab && styles.expandedTabActive]}
                  >
                    <Text style={[styles.expandedTabText, playerTab === tab && styles.expandedTabTextActive]}>
                      {tab === 'next' ? 'Berikutnya' : tab === 'lyrics' ? 'Lirik' : 'Terkait'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tab Content Area */}
              <View style={styles.expandedContent}>
                {playerTab === 'lyrics' && (
                  <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    {activeTrack?.lyrics?.map((lyric: any, index: number) => {
                      const isActive = index === activeLyricIndex;
                      return (
                        <Text key={index} style={[styles.lyricText, isActive && styles.lyricTextActive, { textAlign: 'left' }]}>
                          {lyric.text}
                        </Text>
                      );
                    })}
                  </ScrollView>
                )}

                {playerTab === 'next' && (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                    {playlist.slice(playlist.findIndex(p => p.id === activeTrack?.id) + 1).map(item => (
                      <TouchableOpacity 
                        key={item.id} 
                        style={[styles.audioCard, { borderBottomColor: 'rgba(255,255,255,0.1)' }]} 
                        onPress={() => { playTrack(item); setIsExpanded(false); }}
                      >
                        <Image source={item.img} style={styles.audioThumb} />
                        <View style={styles.audioInfo}>
                          <Text style={[styles.audioTitle, { color: 'white' }]}>{item.title}</Text>
                          <Text style={[styles.audioDesc, { color: 'rgba(255,255,255,0.6)' }]}>{item.desc}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                    {playlist.findIndex(p => p.id === activeTrack?.id) === playlist.length - 1 && (
                      <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40, fontStyle: 'italic' }}>
                        Ini adalah lagu terakhir di putaran.
                      </Text>
                    )}
                  </ScrollView>
                )}

                {playerTab === 'related' && (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                    {playlist.filter(p => p.artifactId === activeTrack?.artifactId && p.id !== activeTrack?.id).map(item => (
                      <TouchableOpacity 
                        key={item.id} 
                        style={[styles.audioCard, { borderBottomColor: 'rgba(255,255,255,0.1)' }]} 
                        onPress={() => { playTrack(item); setIsExpanded(false); }}
                      >
                        <Image source={item.img} style={styles.audioThumb} />
                        <View style={styles.audioInfo}>
                          <Text style={[styles.audioTitle, { color: 'white' }]}>{item.title}</Text>
                          <Text style={[styles.audioDesc, { color: 'rgba(255,255,255,0.6)' }]}>{item.desc}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                    {playlist.filter(p => p.artifactId === activeTrack?.artifactId && p.id !== activeTrack?.id).length === 0 && (
                      <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40, fontStyle: 'italic' }}>
                        Tidak ada audio lain yang terkait dari artefak yang sama.
                      </Text>
                    )}
                  </ScrollView>
                )}
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  audioList: {
    marginBottom: 32,
  },
  audioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  audioThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  audioInfo: {
    flex: 1,
    paddingHorizontal: 16,
  },
  audioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  audioDesc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  playBtnSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
  },
  gridImg: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginBottom: 12,
  },
  gridText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },

  // Player Modal Styles
  playerContainer: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    marginBottom: 20, // dikurangi agar muat
  },
  closeBtn: {
    padding: 4,
  },
  playerHeaderText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  albumArtContainer: {
    alignItems: 'center',
    marginBottom: 24, // dikurangi agar muat
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.6,
    shadowRadius: 35,
    elevation: 25,
  },
  albumArtLarge: {
    width: Math.min(width - 48, height * 0.35), // responsif, jangan sampai memakan seluruh layar
    height: Math.min(width - 48, height * 0.35),
    borderRadius: 20,
  },
  titleContainer: {
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  playerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
  },
  playerDesc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  progressContainer: {
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '500',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    marginBottom: 20,
  },
  playPauseBtnLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingBottom: Platform.OS === 'ios' ? 20 : 30,
  },
  bottomNavText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  lyricText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 38,
    marginBottom: 20,
  },
  lyricTextActive: {
    color: 'white',
    fontSize: 28,
    fontWeight: '800',
    opacity: 1,
  },
  
  // Expanded View Styles
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    marginBottom: 20,
  },
  expandedTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  expandedTab: {
    marginRight: 32,
    paddingVertical: 12,
  },
  expandedTabActive: {
    borderBottomWidth: 3,
    borderBottomColor: 'white',
  },
  expandedTabText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontWeight: '600',
  },
  expandedTabTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  expandedContent: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Galeri Foto
  photoCard: {
    width: 200,
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  exploreImg: {
    width: '100%',
    height: '100%',
  },
  exploreOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  exploreTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  exploreTypeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  exploreName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

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
    backdropFilter: 'blur(20px)',
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
  photoCloseBtn: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});
