import React from 'react';
import { View, StyleSheet, Dimensions, Text, Platform } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MapScreen() {
  const initialRegion = {
    latitude: 0.9255,
    longitude: 104.4170,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  const markers = [
    {
      id: 1,
      coordinate: { latitude: 0.9250, longitude: 104.4168 },
      title: "Masjid Raya Sultan Riau",
      description: "Masjid bersejarah terbuat dari putih telur."
    },
    {
      id: 2,
      coordinate: { latitude: 0.9265, longitude: 104.4180 },
      title: "Makam Raja Ali Haji",
      description: "Peristirahatan terakhir bapak bahasa."
    },
    {
      id: 3,
      coordinate: { latitude: 0.9270, longitude: 104.4150 },
      title: "Istana Kantor",
      description: "Pusat pemerintahan masa lampau."
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.headerTitle}>Peta Jejak Sejarah</Text>
          <Text style={styles.headerDesc}>Jelajahi situs bersejarah Pulau Penyengat</Text>
        </SafeAreaView>
      </View>

      <MapView 
        style={styles.map} 
        initialRegion={initialRegion}
        showsUserLocation={true}
      >
        {markers.map(marker => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            pinColor="#0088CC"
          />
        ))}
      </MapView>

      <View style={styles.overlayOverlay}>
        <Text style={styles.overlayTitle}>Rekomendasi Rute</Text>
        <Text style={styles.overlayDesc}>Pelabuhan ➔ Masjid Raya ➔ Makam Raja Ali Haji</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 10,
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0088CC',
  },
  headerDesc: {
    fontSize: 13,
    color: '#65676b',
    marginTop: 4,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  overlayOverlay: {
    position: 'absolute',
    bottom: 110, // above the tab bar
    alignSelf: 'center',
    width: '90%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  overlayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1e21',
  },
  overlayDesc: {
    fontSize: 13,
    color: '#65676b',
    marginTop: 4,
  }
});
