import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AudioCard = ({ title, desc, audioUrl, thumbImg }: { title: string, desc: string, audioUrl: string, thumbImg: any }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  async function playSound() {
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
      <Image source={thumbImg} style={styles.audioThumb} />
      <View style={styles.audioInfo}>
        <Text style={styles.audioTitle}>{title}</Text>
        <Text style={styles.audioDesc}>{desc}</Text>
      </View>
      <TouchableOpacity style={styles.playBtn} onPress={playSound}>
        <Feather name={isPlaying ? "pause" : "play"} size={16} color="#0f172a" style={isPlaying ? {} : { marginLeft: 2 }} />
      </TouchableOpacity>
    </View>
  );
};

export default function GalleryScreen() {
  const items = [
    {
      id: 1,
      title: 'Gurindam Dua Belas',
      desc: 'Narasi lisan petuah agama & budi pekerti.',
      audioUrl: 'https://actions.google.com/sounds/v1/water/rain_on_roof.ogg',
      img: require('../../assets/images/naskah_gurindam_1776493215711.png')
    },
    {
      id: 2,
      title: 'Bustan al-Katibin',
      desc: 'Penjelasan tata bahasa Melayu Nusantara.',
      audioUrl: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg',
      img: require('../../assets/images/masjid_penyengat_1776493242751.png')
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      <SafeAreaView edges={['top']} style={{ flex: 0, backgroundColor: '#ffffff' }} />
      <ScrollView bounces={false} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Galeri Naskah</Text>
          <Text style={styles.headerDesc}>Dengarkan mahakarya & amati manuskrip aslinya.</Text>
        </View>

        <Text style={styles.sectionTitle}>Daftar Putar</Text>
        <View style={styles.audioList}>
          {items.map(item => (
            <AudioCard
              key={item.id}
              title={item.title}
              desc={item.desc}
              audioUrl={item.audioUrl}
              thumbImg={item.img}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Eksplorasi Mendalam</Text>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Image
              source={require('../../assets/images/naskah_gurindam_1776493215711.png')}
              style={styles.gridImg}
            />
            <Text style={styles.gridText}>Gurindam Asli</Text>
          </View>
          <View style={styles.gridItem}>
            <Image
              source={require('../../assets/images/masjid_penyengat_1776493242751.png')}
              style={styles.gridImg}
            />
            <Text style={styles.gridText}>Masjid Raya</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
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
  playBtn: {
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
  }
});
