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

  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      fetchPlaylist();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlaylist();
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
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setIsPlaying(true);
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
          <Text style={styles.headerTitle}>Galeri Naskah</Text>
          <Text style={styles.headerDesc}>Dengarkan mahakarya & amati manuskrip aslinya.</Text>
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

        <Text style={styles.sectionTitle}>Eksplorasi Mendalam</Text>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Image source={require('../../assets/images/naskah_gurindam_1776493215711.jpg')} style={styles.gridImg} />
            <Text style={styles.gridText}>Gurindam Asli</Text>
          </View>
          <View style={styles.gridItem}>
            <Image source={require('../../assets/images/masjid_penyengat_1776493242751.jpg')} style={styles.gridImg} />
            <Text style={styles.gridText}>Masjid Raya</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

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
  }
});
