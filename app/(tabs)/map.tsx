import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const [activeSite, setActiveSite] = useState<any>(null);

  const initialRegion = {
    latitude: 0.9255,
    longitude: 104.4170,
    latitudeDelta: 0.008,
    longitudeDelta: 0.008,
  };

  const markers = [
    {
      id: 1,
      coordinate: { latitude: 0.9250, longitude: 104.4168 },
      title: "Masjid Raya Sultan Riau",
      description: "Seni arsitektur ikonis yang dibangun awal abad 19 menggunakan bahan baku putih telur."
    },
    {
      id: 2,
      coordinate: { latitude: 0.9265, longitude: 104.4180 },
      title: "Makam Raja Ali Haji",
      description: "Peristirahatan bapak bahasa Indonesia, pencipta Gurindam Dua Belas."
    },
    {
      id: 3,
      coordinate: { latitude: 0.9270, longitude: 104.4150 },
      title: "Istana Kantor",
      description: "Bekas pusat kediaman resmi dan pemerintahan Yang Dipertuan Muda."
    }
  ];

  // Coordinates strictly for drawing the guided tour path
  const tourRoute = [
    { latitude: 0.9240, longitude: 104.4170 }, // Start (Pelabuhan)
    { latitude: 0.9250, longitude: 104.4168 }, // Masjid
    { latitude: 0.9258, longitude: 104.4175 }, // Path
    { latitude: 0.9265, longitude: 104.4180 }, // Makam
    { latitude: 0.9268, longitude: 104.4160 }, // Path
    { latitude: 0.9270, longitude: 104.4150 }, // Istana
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        mapType="standard"
        showsCompass={false}
      >
        <Polyline
          coordinates={tourRoute}
          strokeColor="#0f172a"
          strokeWidth={4}
          lineDashPattern={[2, 4]} // creates a dashed walking path line
        />

        {markers.map(marker => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            onPress={() => setActiveSite(marker)}
          >
            <View style={styles.customMarker}>
              <View style={styles.markerDot} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Floating Header */}
      <SafeAreaView edges={['top']} style={styles.headerContainer} pointerEvents="box-none">
        <Animated.View entering={FadeInDown.duration(600)} style={styles.headerCard}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Jalur Tur Edukasi</Text>
            <Text style={styles.headerDesc}>Estimasi waktu jalan kaki: 45 menit</Text>
          </View>
          <TouchableOpacity style={styles.infoBtn}>
            <Feather name="info" size={20} color="#0f172a" />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>

      {/* Floating Bottom Info Sheet */}
      {activeSite ? (
        <Animated.View entering={FadeInUp.duration(400)} style={styles.bottomCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{activeSite.title}</Text>
            <TouchableOpacity onPress={() => setActiveSite(null)} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <Text style={styles.cardDesc}>{activeSite.description}</Text>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Dengarkan Penjelasan Audio</Text>
            <Feather name="play-circle" size={18} color="white" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.bottomInstructionCard}>
          <Feather name="navigation" size={20} color="#0f172a" style={{ marginBottom: 12 }} />
          <Text style={styles.instructionTitle}>Mulai Eksplorasi</Text>
          <Text style={styles.instructionDesc}>Ketuk salah satu titik di peta untuk melihat detail situs warisan.</Text>
        </Animated.View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  map: {
    width: width,
    height: height,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
  },
  headerCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8, // mostly for Android
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  headerDesc: {
    fontSize: 13,
    color: '#64748b',
  },
  infoBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: 'white',
  },
  bottomInstructionCard: {
    position: 'absolute',
    bottom: 100, // accommodate bottom tab
    width: width - 40,
    alignSelf: 'center',
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  instructionDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 100, // accommodate bottom tab
    width: width - 40,
    alignSelf: 'center',
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginRight: 16,
    lineHeight: 26,
  },
  closeBtn: {
    padding: 4,
  },
  cardDesc: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  }
});
