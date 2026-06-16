import { Feather, Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, 
  TouchableOpacity, View, Modal, Dimensions, Platform, ActivityIndicator,
  RefreshControl, LayoutAnimation, UIManager, Alert, Linking, TextInput, Pressable
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import CustomToast, { CustomToastManager as Toast } from '@/components/CustomToast';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusEffect, useRouter } from 'expo-router';
import ImageViewing from 'react-native-image-viewing';
import { Video, ResizeMode } from 'expo-av';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const FALLBACK_IMAGE = require('../../assets/images/naskah_gurindam_1776493215711.webp');

export default function GalleryScreen() {
  const { mode, isDark, colors } = useTheme();
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const styles = getStyles(colors, isDark);
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
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [shouldPlayNext, setShouldPlayNext] = useState(false);
  const [playerTab, setPlayerTab] = useState<'next' | 'lyrics' | 'related' | 'ai'>('lyrics');

  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  // Eksplorasi Mendalam
  const [artifactsData, setArtifactsData] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [zoomImageUri, setZoomImageUri] = useState<string | null>(null);
  const [galleryPage, setGalleryPage] = useState(0);
  const [galleryHasMore, setGalleryHasMore] = useState(true);
  const [galleryLoadingMore, setGalleryLoadingMore] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (selectedPhoto) {
      checkFavoriteLikeStatus(selectedPhoto.id);
    }
  }, [selectedPhoto]);

    const checkFavoriteLikeStatus = async (id: string) => {
    try {
      const savedStr = await AsyncStorage.getItem('user_saves');
      if (savedStr) {
        const saved = JSON.parse(savedStr);
        // Handle both old format (array of objects) and new format (array of strings)
        const strIds = saved.map((item: any) => {
          let s = String(typeof item === 'string' || typeof item === 'number' ? item : (item.id || item));
          if (!s.includes('_')) s = 'legacy_' + s; // Normalize old IDs dynamically
          return s;
        });
        let targetId = String(id);
        if (!targetId.includes('_')) targetId = 'legacy_' + targetId;
        setIsSaved(strIds.includes(targetId));
      } else {
        setIsSaved(false);
      }
      const likedStr = await AsyncStorage.getItem(`user_likes_${id}`);
      setIsLiked(likedStr === 'true');
    } catch (e) {}
  };

  const handleToggleSave = async () => {
    if (!selectedPhoto) return;
    if (!isLoggedIn) {
      Alert.alert(
        'Akses Ditolak', 
        'Anda harus login untuk menyimpan koleksi ini.',
        [
          { text: 'Batal', style: 'cancel' },
          { 
            text: 'Login', 
            onPress: async () => {
              await import('@react-native-async-storage/async-storage').then(m => m.default.setItem('force_login_tab', 'true'));
              router.push('/login');
            }
          }
        ]
      );
      return;
    }
    try {
      const savedStr = await AsyncStorage.getItem('user_saves');
      let savedIds = savedStr ? JSON.parse(savedStr) : [];
      
      // Clean up and ensure string format
      savedIds = savedIds.map((item: any) => {
        let s = String(typeof item === 'string' || typeof item === 'number' ? item : (item.id || item));
        if (!s.includes('_')) s = 'legacy_' + s; // Normalize old IDs dynamically
        return s;
      }).filter(Boolean);
      let strId = String(selectedPhoto.id);
      if (!strId.includes('_')) strId = 'legacy_' + strId;
      
      const exists = savedIds.includes(strId);
      
      if (exists) {
        savedIds = savedIds.filter((itemId: string) => itemId !== strId);
        setIsSaved(false);
      } else {
        savedIds.push(strId);
        setIsSaved(true);
      }
      
      Haptics.notificationAsync(exists ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: exists ? 'error' : 'success',
        text1: exists ? t('removedFromFav') || 'Dihapus dari Koleksi' : t('addedToFav') || 'Disimpan ke Koleksi',
        text2: exists ? 'Artefak dihapus dari koleksi Anda.' : 'Tersimpan aman di halaman Profil Anda.',
        position: 'top',
        visibilityTime: 3000,
      });
      await AsyncStorage.setItem('user_saves', JSON.stringify(savedIds));
    } catch (e) {}
  };

  const handleToggleLike = async () => {
    if (!selectedPhoto) return;
    if (!isLoggedIn) {
      Alert.alert(
        'Akses Ditolak', 
        'Anda harus login untuk menyukai item ini.',
        [
          { text: 'Batal', style: 'cancel' },
          { 
            text: 'Login', 
            onPress: async () => {
              await import('@react-native-async-storage/async-storage').then(m => m.default.setItem('force_login_tab', 'true'));
              router.push('/login');
            }
          }
        ]
      );
      return;
    }
    try {
      const newStatus = !isLiked;
      setIsLiked(newStatus);
      if (newStatus) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await AsyncStorage.setItem(`user_likes_${selectedPhoto.id}`, newStatus ? 'true' : 'false');
    } catch (e) {}
  };
  const [searchQuery, setSearchQuery] = useState('');

  const GALLERY_PAGE_SIZE = 15;

  const scrollViewRef = useRef<ScrollView>(null);

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    let videoId = '';
    
    // (Fungsi ini tidak lagi digunakan secara aktif karena WebView diganti eksternal link, tapi dibiarkan untuk jaga-jaga jika diperlukan formatnya)
    return videoId ? `https://www.youtube.com/embed/${videoId}?playsinline=1` : url;
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlaylist();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setGalleryPage(0);
    setGalleryHasMore(true);
    await Promise.all([fetchPlaylist(), fetchGalleryPhotos(0, false)]);
    setRefreshing(false);
  }, []);

  const fetchPlaylist = async () => {
    setIsLoading(true);
    // Mengambil item galeri yang memiliki audio_url, beserta data artefak induknya
    const { data: legacyData } = await supabase
      .from('gallery_items')
      .select('*, artifacts(name, image_url, description)')
      .not('audio_url', 'is', null)
      .neq('audio_url', '');

    // Mengambil data musik dari tabel khusus 'musics'
    const { data: musicsData } = await supabase
      .from('musics')
      .select('*')
      .order('id', { ascending: false });

    let combined: any[] = [];

    if (legacyData) {
      const formattedLegacy = legacyData.map(item => ({
        id: `legacy_${item.id}`,
        artifactId: item.artifact_id, // Untuk fitur terkait
        title: item.title || item.artifacts?.name || 'Audio Tanpa Judul',
        desc: item.description || item.artifacts?.description || 'Tidak ada deskripsi',
        audioUrl: item.audio_url,
        img: item.image_url 
             ? { uri: item.image_url } 
             : (item.artifacts?.image_url ? { uri: item.artifacts.image_url } : FALLBACK_IMAGE),
        lyrics: item.lyrics 
             ? item.lyrics.split('\n').map((line: string, i: number) => {
                 const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
                 if (match) {
                   const min = parseInt(match[1]);
                   const sec = parseInt(match[2]);
                   let msStr = match[3];
                   if (msStr.length === 2) msStr += '0';
                   const ms = parseInt(msStr);
                   return { time: min * 60000 + sec * 1000 + ms, text: match[4].trim() };
                 }
                 return { time: -1, text: line };
               }) 
             : [
                 { time: -1, text: "Lirik belum tersedia untuk audio ini." }
               ]
      }));
      combined = [...combined, ...formattedLegacy];
    }

    if (musicsData) {
      const formattedMusics = musicsData.map(item => ({
        id: `music_${item.id}`,
        artifactId: null,
        title: item.title,
        desc: item.description || 'Tidak ada deskripsi',
        audioUrl: item.audio_url,
        img: item.image_url ? { uri: item.image_url } : FALLBACK_IMAGE,
        lyrics: item.lyrics 
             ? item.lyrics.split('\n').map((line: string) => {
                 const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
                 if (match) {
                   const min = parseInt(match[1]);
                   const sec = parseInt(match[2]);
                   let msStr = match[3];
                   if (msStr.length === 2) msStr += '0';
                   const ms = parseInt(msStr);
                   return { time: min * 60000 + sec * 1000 + ms, text: match[4].trim() };
                 }
                 return { time: -1, text: line };
               })
             : [
                 { time: -1, text: "Lirik belum tersedia untuk audio ini." }
               ]
      }));
      combined = [...combined, ...formattedMusics];
    }

    setPlaylist(combined);
    setIsLoading(false);
  };

  const fetchGalleryPhotos = async (pageNum = 0, append = false, query = searchQuery) => {
    // Set Audio Mode agar bisa berjalan meski HP di-silent
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (e) {}

    if (append) setGalleryLoadingMore(true);

    const from = pageNum * GALLERY_PAGE_SIZE;
    const to = from + GALLERY_PAGE_SIZE - 1;

    let queryBuilder = supabase
      .from('gallery_items')
      .select('*, artifacts(name, type, year, description)')
      .or('image_url.neq."",video_url.neq.""');

    if (query) {
      queryBuilder = queryBuilder.ilike('title', `%${query}%`);
    }

    const { data } = await queryBuilder
      .order('id', { ascending: false })
      .range(from, to);

    const fetched = data || [];
    if (fetched.length < GALLERY_PAGE_SIZE) setGalleryHasMore(false);
    else setGalleryHasMore(true);

    if (append) {
      setArtifactsData(prev => [...prev, ...fetched]);
    } else {
      setArtifactsData(fetched);
    }
    setGalleryPage(pageNum);
    if (append) setGalleryLoadingMore(false);
  };

  const loadMoreGallery = useCallback(() => {
    if (!galleryLoadingMore && galleryHasMore) {
      fetchGalleryPhotos(galleryPage + 1, true, searchQuery);
    }
  }, [galleryLoadingMore, galleryHasMore, galleryPage]);

  useFocusEffect(
    useCallback(() => {
      fetchGalleryPhotos(0, false, searchQuery);
    }, [])
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchGalleryPhotos(0, false, searchQuery);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const playTrackIdRef = useRef<string | null>(null);

  const playTrack = async (track: any, autoPlay: boolean = false) => {
    const currentPlayId = Date.now().toString() + Math.random();
    playTrackIdRef.current = currentPlayId;

    if (soundRef.current) {
      soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
      setSound(null);
    }
    
    setActiveTrack(track);
    setShowPlayer(true);
    setPositionMillis(0);
    setIsPlaying(autoPlay);
    setAiExplanation(null);
    setAiLoading(false);

    setTimeout(async () => {
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: track.audioUrl },
          { shouldPlay: autoPlay, progressUpdateIntervalMillis: 500 },
          onPlaybackStatusUpdate
        );
        
        if (playTrackIdRef.current === currentPlayId) {
          soundRef.current = newSound;
          setSound(newSound);
        } else {
          newSound.unloadAsync().catch(() => {});
        }
      } catch (e: any) {
        if (playTrackIdRef.current === currentPlayId) {
          console.log('Error playing audio', e);
          setIsPlaying(false);
          Alert.alert('Error Audio', 'Tidak dapat memutar lagu ini. Pastikan koneksi internet stabil atau URL valid.\nDetail: ' + (e.message || 'Unknown error'));
        }
      }
    }, 100);
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPositionMillis(status.positionMillis);
      if (status.durationMillis) {
        setDurationMillis(status.durationMillis);
      }
      if (status.didJustFinish) {
        setIsPlaying(false);
        setShouldPlayNext(true);
      }
    }
  };

  const skipToNext = (forcePlay?: boolean) => {
    if (!activeTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(p => p.id === activeTrack.id);
    if (currentIndex >= 0 && currentIndex < playlist.length - 1) {
      playTrack(playlist[currentIndex + 1], forcePlay !== undefined ? forcePlay : isPlaying);
    }
  };

  const skipToPrev = (forcePlay?: boolean) => {
    if (!activeTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(p => p.id === activeTrack.id);
    if (currentIndex > 0) {
      playTrack(playlist[currentIndex - 1], forcePlay !== undefined ? forcePlay : isPlaying);
    } else {
      if (sound) {
        sound.setPositionAsync(0);
        if (forcePlay !== undefined ? forcePlay : isPlaying) {
          sound.playAsync();
          setIsPlaying(true);
        }
      }
    }
  };

  const handleSeek = async (event: any) => {
    if (!sound || durationMillis === 0 || progressBarWidth === 0) return;
    const { locationX } = event.nativeEvent;
    const percent = Math.max(0, Math.min(1, locationX / progressBarWidth));
    const newPosition = percent * durationMillis;
    await sound.setPositionAsync(newPosition);
    setPositionMillis(newPosition);
  };

  useEffect(() => {
    if (shouldPlayNext) {
      setShouldPlayNext(false);
      skipToNext(true);
    }
  }, [shouldPlayNext]);

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

  const fetchAiExplanation = async () => {
    if (!activeTrack?.lyrics) return;
    const fullLyrics = activeTrack.lyrics.map((l:any) => l.text).join('\n');
    setAiLoading(true);
    setAiExplanation(null);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen/qwen-2.5-7b-instruct',
          messages: [
            {
              role: 'system',
              content: 'Anda adalah asisten ahli budaya dan sejarah Melayu. Tugas Anda adalah menganalisis, menjelaskan makna filosofis, dan menerjemahkan (jika perlu) lirik syair/lagu daerah yang diberikan pengguna ke dalam bahasa Indonesia yang sangat indah, jelas, dan mudah dipahami.'
            },
            {
              role: 'user',
              content: `Tolong jelaskan makna dan filosofi dari lirik berikut:\n\n${fullLyrics}`
            }
          ]
        })
      });
      const data = await response.json();
      if (data.choices && data.choices[0]) {
        setAiExplanation(data.choices[0].message.content);
      } else {
        setAiExplanation('Maaf, AI gagal memproses permintaan.');
      }
    } catch (error) {
      setAiExplanation('Terjadi kesalahan jaringan saat menghubungi AI.');
    }
    setAiLoading(false);
  };

  useEffect(() => {
    return sound ? () => { sound.unloadAsync().catch(() => {}); } : undefined;
  }, [sound]);

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

  let activeLyricIndex = -1;
  const hasTimestamps = activeTrack?.lyrics?.some((l: any) => l.time >= 0);

  if (hasTimestamps && activeTrack?.lyrics) {
    for (let i = activeTrack.lyrics.length - 1; i >= 0; i--) {
      if (activeTrack.lyrics[i].time >= 0 && positionMillis >= activeTrack.lyrics[i].time) {
        activeLyricIndex = i;
        break;
      }
    }
  }

  useEffect(() => {
    if (showPlayer && scrollViewRef.current && activeLyricIndex >= 0 && hasTimestamps) {
      scrollViewRef.current.scrollTo({ 
        y: Math.max(0, (activeLyricIndex * 42) - 60), 
        animated: true 
      });
    }
  }, [activeLyricIndex, showPlayer, isExpanded, playerTab, hasTimestamps]);

  const progressPercent = Math.min((positionMillis / durationMillis) * 100, 100);

  const openExpandedView = (tab: 'next' | 'lyrics' | 'related' | 'ai') => {
    setPlayerTab(tab);
    setIsExpanded(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={showPlayer ? "light-content" : "dark-content"} />
      <SafeAreaView edges={['top']} style={{ flex: 0, backgroundColor: colors.card }} />
      
      {/* Sticky Header + Search */}
      <View style={styles.stickyHeader}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('galleryAndMedia')}</Text>
          <Text style={styles.headerDesc}>{t('galleryDesc')}</Text>
        </View>

        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Feather name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchMedia')}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.text]} />
        }
      >
        <Text style={styles.sectionTitle}>{t('playlist')}</Text>
        <View style={styles.audioList}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.text} style={{ marginVertical: 20 }} />
          ) : playlist.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>{t('noAudio')}</Text>
          ) : (
            playlist.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.desc.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
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
                  <Feather name="play" size={16} color={colors.text} style={{ marginLeft: 2 }} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>{t('visualGallery')}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 16, paddingHorizontal: 20 }}>
          {artifactsData.length} koleksi foto & video artefak bersejarah
        </Text>
        
        {artifactsData.length === 0 ? (
          <View style={{ padding: 30, alignItems: 'center' }}>
            <Feather name="image" size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>{t('noVisualMedia')}</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            {/* Pinterest-style Masonry Grid */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* Kolom Kiri */}
              <View style={{ flex: 1 }}>
                {artifactsData.filter((_: any, i: number) => i % 2 === 0).map((item: any, index: number) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.photoCard, { height: index % 3 === 0 ? 220 : 170 }]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedPhoto(item)}
                  >
                    <Image source={item.image_url ? { uri: item.image_url } : FALLBACK_IMAGE} style={styles.exploreImg} />
                    <LinearGradient 
                      colors={['transparent', 'rgba(0,0,0,0.8)']} 
                      locations={[0.35, 1]}
                      style={StyleSheet.absoluteFillObject}
                    />
                    {item.video_url && (
                      <View style={styles.videoPlayOverlay}>
                        <View style={styles.videoPlayBtn}>
                          <Feather name="play" size={20} color={colors.background} style={{ marginLeft: 2 }} />
                        </View>
                      </View>
                    )}
                    <View style={styles.exploreOverlay}>
                      <View style={[styles.exploreTypeBadge, item.video_url && { backgroundColor: 'rgba(239,68,68,0.7)', borderColor: 'rgba(239,68,68,0.5)' }]}>
                        <Feather name={item.video_url ? 'film' : 'image'} size={9} color={colors.background} style={{ marginRight: 4 }} />
                        <Text style={styles.exploreTypeText}>{item.video_url ? 'Video' : (item.artifacts?.type || t('photo'))}</Text>
                      </View>
                      <Text style={styles.exploreName} numberOfLines={1}>{item.title || item.artifacts?.name || t('untitled')}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Kolom Kanan */}
              <View style={{ flex: 1 }}>
                {artifactsData.filter((_: any, i: number) => i % 2 === 1).map((item: any, index: number) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.photoCard, { height: index % 3 === 0 ? 170 : 220 }]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedPhoto(item)}
                  >
                    <Image source={item.image_url ? { uri: item.image_url } : FALLBACK_IMAGE} style={styles.exploreImg} />
                    <LinearGradient 
                      colors={['transparent', 'rgba(0,0,0,0.8)']} 
                      locations={[0.35, 1]}
                      style={StyleSheet.absoluteFillObject}
                    />
                    {item.video_url && (
                      <View style={styles.videoPlayOverlay}>
                        <View style={styles.videoPlayBtn}>
                          <Feather name="play" size={20} color={colors.background} style={{ marginLeft: 2 }} />
                        </View>
                      </View>
                    )}
                    <View style={styles.exploreOverlay}>
                      <View style={[styles.exploreTypeBadge, item.video_url && { backgroundColor: 'rgba(239,68,68,0.7)', borderColor: 'rgba(239,68,68,0.5)' }]}>
                        <Feather name={item.video_url ? 'film' : 'image'} size={9} color={colors.background} style={{ marginRight: 4 }} />
                        <Text style={styles.exploreTypeText}>{item.video_url ? 'Video' : (item.artifacts?.type || t('photo'))}</Text>
                      </View>
                      <Text style={styles.exploreName} numberOfLines={1}>{item.title || item.artifacts?.name || t('untitled')}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {galleryHasMore && artifactsData.length > 0 && (
              <TouchableOpacity 
                onPress={loadMoreGallery}
                style={{ marginTop: 8, paddingVertical: 14, backgroundColor: colors.border, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                activeOpacity={0.7}
              >
                {galleryLoadingMore ? (
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                ) : (
                  <>
                    <Feather name="plus-circle" size={16} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 14 }}>{t('loadMore')}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* MODAL FOTO DETAIL */}
      {selectedPhoto && (
        <Modal visible={!!selectedPhoto} animationType="fade" transparent={false} onRequestClose={() => setSelectedPhoto(null)}>
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar barStyle="light-content" />
            
            {selectedPhoto?.video_url ? (
              <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
                {/* Header khusus Video */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 }}>
                  <TouchableOpacity 
                    onPress={() => setSelectedPhoto(null)} 
                    style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
                  >
                    <Feather name="chevron-left" size={22} color={'#ffffff'} />
                  </TouchableOpacity>
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700', alignSelf: 'center' }}>{t('galVideoPlayer')}</Text>
                  <View style={{ width: 44 }} />
                </View>

                {/* Pemutar Video */}
                <View style={{ width: '100%', aspectRatio: 16/9, backgroundColor: '#000' }}>
                  {selectedPhoto.video_url.includes('youtube.com') || selectedPhoto.video_url.includes('youtu.be') ? (
                    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }}>
                      <Feather name="youtube" size={48} color="#ef4444" style={{ marginBottom: 16 }} />
                      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
                        {t('galYTAlert')}
                      </Text>
                      <TouchableOpacity 
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef4444', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24 }}
                        onPress={() => Linking.openURL(selectedPhoto.video_url)}
                        activeOpacity={0.8}
                      >
                        <Feather name="external-link" size={16} color={'#ffffff'} style={{ marginRight: 8 }} />
                        <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>{t('galWatchYT')}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Video
                      source={{ uri: selectedPhoto.video_url }}
                      style={{ flex: 1 }}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay
                    />
                  )}
                </View>

                {/* Info Card di Bawah Video */}
                <ScrollView style={{ flex: 1, padding: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="location" size={22} color={'#ffffff'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '800' }} numberOfLines={2}>
                        {selectedPhoto.title || selectedPhoto.artifacts?.name || t('untitled')}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500', marginTop: 2 }}>
                        {selectedPhoto.artifacts?.location || 'Kepulauan Riau'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 14, marginLeft: 10 }}>
                      <TouchableOpacity onPress={handleToggleLike}>
                        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={26} color={isLiked ? "#ef4444" : "#ffffff"} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleToggleSave}>
                        <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isSaved ? "#fbbf24" : "#ffffff"} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.photoStatsRow, { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingVertical: 12 }]}>
                    <View style={styles.photoStatItem}>
                      <Feather name="archive" size={14} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.photoStatText}>{selectedPhoto.artifacts?.type || 'Video'}</Text>
                    </View>
                    <View style={styles.photoStatDivider} />
                    <View style={styles.photoStatItem}>
                      <Feather name="calendar" size={14} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.photoStatText}>{selectedPhoto.artifacts?.year || t('galPresentTime')}</Text>
                    </View>
                  </View>

                  <View style={{ marginTop: 20, marginBottom: 40 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{t('galDescLbl')}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 22 }}>
                        {selectedPhoto.description || selectedPhoto.artifacts?.description || t('galNoDescVideo')}
                      </Text>
                    </View>

                    
                  </ScrollView>
              </SafeAreaView>
            ) : (
              <>
                {/* Mode Tampilan Khusus Gambar (Desain Lama) */}
                <Image source={{ uri: selectedPhoto.image_url }} style={{ width, height, position: "absolute" }} contentFit="cover" transition={500} cachePolicy="memory-disk" />

                {/* Top Buttons (Hanya untuk foto) */}
                <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 }}>
                    <TouchableOpacity 
                      onPress={() => setSelectedPhoto(null)} 
                      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
                    >
                      <Feather name="chevron-left" size={22} color={'#ffffff'} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setZoomImageUri(selectedPhoto.image_url)}
                      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
                    >
                      <Feather name="zoom-in" size={20} color={'#ffffff'} />
                    </TouchableOpacity>
                  </View>
                </SafeAreaView>

                {/* Bottom Card Overlay */}
                <View style={styles.photoDetailCard}>
                  <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: height * 0.45 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Ionicons name="location" size={22} color={'#ffffff'} />
                      </View>
                      <View style={{ flex: 1 }}>
                      <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '800' }} numberOfLines={2}>
                        {selectedPhoto.title || selectedPhoto.artifacts?.name || t('untitled')}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500', marginTop: 2 }}>
                        {selectedPhoto.artifacts?.location || 'Kepulauan Riau'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 14, marginLeft: 10 }}>
                      <TouchableOpacity onPress={handleToggleLike}>
                        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={26} color={isLiked ? "#ef4444" : "#ffffff"} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleToggleSave}>
                        <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isSaved ? "#fbbf24" : "#ffffff"} />
                      </TouchableOpacity>
                    </View>
                  </View>

                    <View style={styles.photoStatsRow}>
                      <View style={styles.photoStatItem}>
                        <Feather name="archive" size={14} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.photoStatText}>{selectedPhoto.artifacts?.type || 'Foto'}</Text>
                      </View>
                      <View style={styles.photoStatDivider} />
                      <View style={styles.photoStatItem}>
                        <Feather name="calendar" size={14} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.photoStatText}>{selectedPhoto.artifacts?.year || t('galPresentTime')}</Text>
                      </View>
                      <View style={styles.photoStatDivider} />
                      <View style={styles.photoStatItem}>
                        <Ionicons name="star" size={14} color="#fbbf24" />
                        <Text style={styles.photoStatText}>5.0</Text>
                      </View>
                    </View>

                    <View style={{ marginTop: 16 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{t('galDescLbl')}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 22 }}>
                        {selectedPhoto.description || selectedPhoto.artifacts?.description || t('galNoDesc')}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                      <TouchableOpacity 
                        onPress={() => setZoomImageUri(selectedPhoto.image_url)} 
                        style={[styles.photoCloseBtn, { flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' }]}
                        activeOpacity={0.8}
                      >
                        <Feather name="zoom-in" size={16} color={'#ffffff'} />
                        <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>{t('galZoomBtn')}</Text>
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
              </>
            )}
          

          <CustomToast />
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
        <LinearGradient colors={['#0f172a', '#0f172a']} style={styles.playerContainer}>
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
                  <Pressable 
                    style={styles.progressBarBg}
                    onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
                    onPress={handleSeek}
                  >
                    <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                  </Pressable>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{formatTime(positionMillis)}</Text>
                    <Text style={styles.timeText}>{formatTime(durationMillis)}</Text>
                  </View>
                </View>

                {/* Controls */}
                <View style={styles.controlsContainer}>
                  <TouchableOpacity onPress={() => skipToPrev()}>
                    <Ionicons name="play-skip-back" size={32} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseBtnLarge}>
                    <Ionicons name={isPlaying ? "pause" : "play"} size={40} color={'#0f172a'} style={!isPlaying ? {marginLeft: 4} : {}} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => skipToNext()}>
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
                  <Text style={[styles.bottomNavText, { color: '#ffffff', fontWeight: 'bold' }]}>Lirik</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openExpandedView('ai')} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={styles.bottomNavText}>Bedah AI</Text>
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
        <LinearGradient colors={['#0f172a', '#0f172a']} style={{ flex: 1 }}>
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
                    <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16 }} numberOfLines={1}>{activeTrack?.title}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }} numberOfLines={1}>{activeTrack?.desc}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={togglePlayPause} style={{ paddingLeft: 16 }}>
                  <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="white" />
                </TouchableOpacity>
              </View>

              {/* Tab Menu */}
              <View style={styles.expandedTabs}>
                {(['next', 'lyrics', 'ai', 'related'] as const).map(tab => (
                  <TouchableOpacity 
                    key={tab} 
                    onPress={() => setPlayerTab(tab)} 
                    style={[styles.expandedTab, playerTab === tab && styles.expandedTabActive]}
                  >
                    <Text style={[styles.expandedTabText, playerTab === tab && styles.expandedTabTextActive]}>
                      {tab === 'next' ? 'Berikutnya' : tab === 'lyrics' ? 'Lirik' : tab === 'ai' ? 'Bedah AI' : 'Terkait'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tab Content Area */}
              <View style={styles.expandedContent}>
                {playerTab === 'lyrics' && (
                  <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    {activeTrack?.lyrics?.map((lyric: any, index: number) => {
                      const isActive = hasTimestamps ? index === activeLyricIndex : false;
                      const isPlain = !hasTimestamps;
                      return (
                        <Text key={index} style={[
                          styles.lyricText, 
                          isPlain ? { color: '#ffffff', opacity: 0.9, marginBottom: 8 } : {},
                          hasTimestamps && !isActive ? { color: 'rgba(255,255,255,0.4)' } : {},
                          isActive && styles.lyricTextActive, 
                          { textAlign: 'left' }
                        ]}>
                          {lyric.text}
                        </Text>
                      );
                    })}
                  </ScrollView>
                )}

                {playerTab === 'ai' && (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    {/* AI Button Section */}
                    <View style={{ marginTop: 10, padding: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Ionicons name="sparkles" size={20} color="#f59e0b" />
                        <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>Bedah Lirik (RAH VerseAI)</Text>
                      </View>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 16, lineHeight: 20 }}>
                        Dapatkan penjelasan mendalam tentang makna dan filosofi lirik lagu atau naskah ini.
                      </Text>
                      
                      {aiExplanation ? (
                        <View style={{ marginTop: 10, padding: 16, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12 }}>
                          <Text style={{ color: '#ffffff', fontSize: 15, lineHeight: 24 }}>{aiExplanation}</Text>
                        </View>
                      ) : aiLoading ? (
                        <ActivityIndicator color="#f59e0b" style={{ marginVertical: 20 }} />
                      ) : (
                        <TouchableOpacity 
                          style={{ backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                          onPress={fetchAiExplanation}
                        >
                          <Text style={{ color: '#0f172a', fontWeight: 'bold', fontSize: 15 }}>✨ Mulai Bedah Makna</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </ScrollView>
                )}

                {playerTab === 'next' && (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                    {playlist.slice(playlist.findIndex(p => p.id === activeTrack?.id) + 1).map(item => (
                      <TouchableOpacity 
                        key={item.id} 
                        style={[styles.audioCard, { borderBottomColor: 'rgba(255,255,255,0.1)' }]} 
                        onPress={() => { playTrack(item, true); setIsExpanded(false); }}
                      >
                        <Image source={item.img} style={styles.audioThumb} />
                        <View style={styles.audioInfo}>
                          <Text style={[styles.audioTitle, { color: '#ffffff' }]}>{item.title}</Text>
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
                        onPress={() => { playTrack(item, true); setIsExpanded(false); }}
                      >
                        <Image source={item.img} style={styles.audioThumb} />
                        <View style={styles.audioInfo}>
                          <Text style={[styles.audioTitle, { color: '#ffffff' }]}>{item.title}</Text>
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

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  stickyHeader: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 16,
    zIndex: 10,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: colors.text,
  },

  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
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
    borderBottomColor: colors.border,
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
    color: colors.text,
    marginBottom: 4,
  },
  audioDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  playBtnSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.text,
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
    color: '#ffffff',
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
    backgroundColor: '#ffffff',
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
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 30,
  },
  bottomNavText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
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
    color: '#ffffff',
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
    borderBottomColor: '#ffffff',
  },
  expandedTabText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontWeight: '600',
  },
  expandedTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  expandedContent: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Galeri Visual - Pinterest Masonry Grid
  photoCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.border,
    position: 'relative',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  exploreImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(239,68,68,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  exploreOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  exploreTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
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
