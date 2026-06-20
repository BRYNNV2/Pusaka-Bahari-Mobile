import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dimensions, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

const { width, height } = Dimensions.get('window');

const TOUR_ROUTES = [
  {
    id: 'all',
    title: { id: 'Semua Situs', en: 'All Sites' },
    icon: 'map-outline',
    color: '#3b82f6',
    filterFn: (item: any) => true,
  },
  {
    id: 'religi',
    title: { id: 'Religi & Makam', en: 'Religi & Tombs' },
    icon: 'heart-outline',
    color: '#10b981',
    filterFn: (item: any) => 
      item.name?.toLowerCase().includes('masjid') || 
      item.name?.toLowerCase().includes('makam') ||
      item.name?.toLowerCase().includes('tomb') ||
      item.name?.toLowerCase().includes('sultan'),
  },
  {
    id: 'sejarah',
    title: { id: 'Istana & Kejayaan', en: 'Royal Heritage' },
    icon: 'ribbon-outline',
    color: '#f59e0b',
    filterFn: (item: any) => 
      item.name?.toLowerCase().includes('istana') || 
      item.name?.toLowerCase().includes('kantor') || 
      item.name?.toLowerCase().includes('balai') ||
      item.name?.toLowerCase().includes('gedung') ||
      item.name?.toLowerCase().includes('tabib'),
  },
  {
    id: 'militer',
    title: { id: 'Benteng & Pertahanan', en: 'Military & Defense' },
    icon: 'shield-outline',
    color: '#ef4444',
    filterFn: (item: any) => 
      item.name?.toLowerCase().includes('benteng') || 
      item.name?.toLowerCase().includes('meriam') ||
      item.name?.toLowerCase().includes('cannon') ||
      item.name?.toLowerCase().includes('kursi'),
  }
];

export default function MapScreen() {
  const { mode, isDark, colors } = useTheme();
  const { t, language } = useLanguage();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const [activeSite, setActiveSite] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('all');
  const [activeRouteIndex, setActiveRouteIndex] = useState<number>(-1);
  const webViewRef = useRef<WebView>(null);

  const getFilteredMarkers = () => {
    const route = TOUR_ROUTES.find(r => r.id === selectedRouteId);
    if (!route) return markers;
    return markers.filter(route.filterFn);
  };

  useEffect(() => {
    if (webViewRef.current && markers.length > 0) {
      const filtered = getFilteredMarkers();
      const route = TOUR_ROUTES.find(r => r.id === selectedRouteId);
      const color = route ? route.color : colors.primary;

      // Sort markers west-to-east (by longitude) to draw a smooth route path
      const sorted = [...filtered].sort((a, b) => Number(a.longitude) - Number(b.longitude));
      const routeCoords = sorted.map(m => [m.latitude, m.longitude]);

      const msg = JSON.stringify({
        type: 'UPDATE_MARKERS',
        markers: filtered,
        routeCoords: routeCoords,
        color: color
      });
      webViewRef.current.postMessage(msg);
    }
  }, [selectedRouteId, markers]);

  const fetchLocations = async () => {
    setLoading(true);
    // Fetch artifacts that have coordinates
    const { data } = await supabase
      .from('artifacts')
      .select('id, name, description, type, year, latitude, longitude, image_url')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('id', { ascending: true });

    setMarkers(data ?? []);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchLocations();
    }, [])
  );

  // Center WebView Map when activeSite changes
  useEffect(() => {
    if (activeSite && webViewRef.current) {
      const msg = JSON.stringify({
        type: 'CENTER_ON',
        lat: activeSite.latitude,
        lng: activeSite.longitude
      });
      webViewRef.current.postMessage(msg);
    }
  }, [activeSite]);

  const onMessage = (event: any) => {
    try {
      const { type, data } = JSON.parse(event.nativeEvent.data);
      if (type === 'CLICK_MARKER') {
        setActiveSite(data);
        const filtered = getFilteredMarkers();
        const sorted = [...filtered].sort((a, b) => Number(a.longitude) - Number(b.longitude));
        const idx = sorted.findIndex((m: any) => m.id === data.id);
        if (idx !== -1) {
          setActiveRouteIndex(idx);
        }
      }
    } catch (e) {
      console.log('Error parsing Leaflet message:', e);
    }
  };

  const generateMapHtml = () => {
    const primaryColor = colors.primary || '#fbbf24';
    // Sort markers west-to-east (by longitude) to draw a smooth route path without crisscrossing
    const sortedMarkersForRoute = [...markers].sort((a, b) => Number(a.longitude) - Number(b.longitude));
    const routeCoords = sortedMarkersForRoute.map(m => [m.latitude, m.longitude]);
    const routeCoordsJson = JSON.stringify(routeCoords);
    const markersJson = JSON.stringify(markers);

    const tileUrl = 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
    const backgroundColor = '#f8fafc';
    const markerBorderColor = '#ffffff';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; background: ${backgroundColor}; }
          .custom-marker {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: rgba(15, 23, 42, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .marker-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: ${primaryColor};
            border: 2px solid ${markerBorderColor};
          }
          .marker-cluster-custom {
            background-color: rgba(139, 94, 60, 0.25);
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .marker-cluster-custom-inner {
            background-color: ${primaryColor};
            color: #ffffff;
            font-weight: 700;
            font-size: 12px;
            border-radius: 50%;
            width: 26px;
            height: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          }
          .leaflet-control-attribution { display: none !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const isDark = ${isDark};
          const markers = ${markersJson};
          const routeCoords = ${routeCoordsJson};
 
          const map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          }).setView([0.9255, 104.4170], 14);
 
          L.tileLayer('${tileUrl}', {
            maxZoom: 19
          }).addTo(map);
 
          // Draw Polyline path
          if (routeCoords.length >= 2) {
            L.polyline(routeCoords, {
              color: '${primaryColor}',
              weight: 4,
              dashArray: '5, 10'
            }).addTo(map);
          }
 
          // Initialize Marker Cluster Group
          const markersClusterGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 40,
            iconCreateFunction: function(cluster) {
              return L.divIcon({
                html: '<div class="marker-cluster-custom"><div class="marker-cluster-custom-inner">' + cluster.getChildCount() + '</div></div>',
                className: 'marker-cluster-custom-icon',
                iconSize: [36, 36]
              });
            }
          });
 
          // Add Markers to cluster group
          markers.forEach(m => {
            const icon = L.divIcon({
              className: '',
              html: '<div class="custom-marker"><div class="marker-dot"></div></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });
 
            const marker = L.marker([m.latitude, m.longitude], { icon })
              .on('click', () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CLICK_MARKER', data: m }));
              });
            
            markersClusterGroup.addLayer(marker);
          });
 
          map.addLayer(markersClusterGroup);
 
          // Handle messages from React Native to dynamically center
          window.addEventListener('message', (event) => {
            try {
              const message = JSON.parse(event.data);
              if (message.type === 'CENTER_ON') {
                map.setView([message.lat, message.lng], 16);
              }
            } catch(e) {}
          });
        </script>
      </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <WebView
        ref={webViewRef}
        style={styles.map}
        originWhitelist={['*']}
        source={{ html: generateMapHtml() }}
        onMessage={onMessage}
        domStorageEnabled={true}
        javaScriptEnabled={true}
      />

      {/* Floating Header */}
      <SafeAreaView edges={['top']} style={styles.headerContainer} pointerEvents="box-none">
        <Animated.View entering={FadeInDown.duration(600)} style={styles.headerCard}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>{t('mapTourPath')}</Text>
            <Text style={styles.headerDesc}>
              {loading ? t('mapLoadingLocation') : t('mapSitesFound').replace('{count}', markers.length.toString())}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchLocations}>
            <Feather name="refresh-cw" size={18} color={colors.text} />
          </TouchableOpacity>
        </Animated.View>

        {/* Route Selector Pills */}
        <Animated.View entering={FadeInDown.duration(600).delay(150)} style={styles.routeSelectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.routeScroll}>
            {TOUR_ROUTES.map((route) => {
              const isSelected = selectedRouteId === route.id;
              const titleText = language === 'en' ? route.title.en : route.title.id;
              return (
                <TouchableOpacity
                  key={route.id}
                  style={[
                    styles.routePill,
                    isSelected && { backgroundColor: route.color, borderColor: route.color }
                  ]}
                  onPress={() => {
                    setSelectedRouteId(route.id);
                    setActiveRouteIndex(-1);
                    setActiveSite(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name={route.icon as any} 
                    size={13} 
                    color={isSelected ? '#ffffff' : colors.textSecondary} 
                  />
                  <Text style={[styles.routePillText, isSelected && styles.routePillTextActive]}>
                    {titleText}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      {/* Loading Overlay */}
      {loading && markers.length === 0 && (
        <View style={styles.loadingOverlay}>
          <LottieView
            source={require('../../assets/animations/Free Searching Animation.json')}
            autoPlay
            loop
            style={{ width: 160, height: 160 }}
          />
          <Text style={[styles.loadingText, { marginTop: 10 }]}>{t('mapLoadingSites')}</Text>
        </View>
      )}

      {/* Floating Bottom Info Sheet */}
      {activeSite ? (
        <Animated.View entering={FadeInUp.duration(400)} style={styles.bottomCard}>
          {/* If a route is selected, show navigation buttons (Prev / Next) at the top of the sheet! */}
          {selectedRouteId !== 'all' && (
            <View style={styles.routeNavigationHeader}>
              <Text style={styles.routeNavigationTitle}>
                {language === 'en' ? 'Route Progress' : 'Panduan Rute'}: {activeRouteIndex + 1} / {getFilteredMarkers().length}
              </Text>
              <View style={styles.routeNavigationButtons}>
                <TouchableOpacity 
                  disabled={activeRouteIndex <= 0}
                  onPress={() => {
                    const filtered = getFilteredMarkers();
                    const sorted = [...filtered].sort((a, b) => Number(a.longitude) - Number(b.longitude));
                    const newIdx = activeRouteIndex - 1;
                    setActiveRouteIndex(newIdx);
                    setActiveSite(sorted[newIdx]);
                  }}
                  style={[styles.routeNavBtn, activeRouteIndex <= 0 && { opacity: 0.4 }]}
                >
                  <Feather name="chevron-left" size={16} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity 
                  disabled={activeRouteIndex >= getFilteredMarkers().length - 1}
                  onPress={() => {
                    const filtered = getFilteredMarkers();
                    const sorted = [...filtered].sort((a, b) => Number(a.longitude) - Number(b.longitude));
                    const newIdx = activeRouteIndex + 1;
                    setActiveRouteIndex(newIdx);
                    setActiveSite(sorted[newIdx]);
                  }}
                  style={[styles.routeNavBtn, activeRouteIndex >= getFilteredMarkers().length - 1 && { opacity: 0.4 }]}
                >
                  <Feather name="chevron-right" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{activeSite.name}</Text>
              <View style={styles.cardMeta}>
                {activeSite.type && (
                  <View style={styles.typePill}>
                    <Text style={styles.typePillText}>{activeSite.type}</Text>
                  </View>
                )}
                {activeSite.year && (
                  <Text style={styles.yearText}>{t('mapYear').replace('{year}', activeSite.year.toString())}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => {
                setActiveSite(null);
                setActiveRouteIndex(-1);
              }} 
              style={styles.closeBtn}
            >
              <Feather name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.cardDesc} numberOfLines={3}>{activeSite.description}</Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(`/artifact/${activeSite.id}` as any)}
          >
            <Text style={styles.actionBtnText}>{t('mapViewDetail')}</Text>
            <Feather name="arrow-right" size={18} color="white" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </Animated.View>
      ) : selectedRouteId !== 'all' && getFilteredMarkers().length > 0 ? (
        /* If route is selected but no marker is active yet, show Route Start Guide */
        <Animated.View entering={FadeInUp.duration(600)} style={styles.bottomInstructionCard}>
          <Ionicons name="compass" size={26} color={TOUR_ROUTES.find(r => r.id === selectedRouteId)?.color || colors.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.instructionTitle}>
            {language === 'en' ? 'Start Curated Tour Route' : 'Mulai Rute Panduan Wisata'}
          </Text>
          <Text style={[styles.instructionDesc, { marginBottom: 14 }]}>
            {language === 'en' 
              ? `This route guides you through ${getFilteredMarkers().length} curated historical sites.` 
              : `Rute ini akan memandu Anda menyusuri ${getFilteredMarkers().length} situs bersejarah pilihan.`}
          </Text>
          <TouchableOpacity
            style={[
              styles.startRouteBtn,
              { backgroundColor: TOUR_ROUTES.find(r => r.id === selectedRouteId)?.color || colors.primary }
            ]}
            onPress={() => {
              const filtered = getFilteredMarkers();
              const sorted = [...filtered].sort((a, b) => Number(a.longitude) - Number(b.longitude));
              setActiveRouteIndex(0);
              setActiveSite(sorted[0]);
            }}
          >
            <Ionicons name="play" size={16} color="#ffffff" />
            <Text style={styles.startRouteBtnText}>
              {language === 'en' ? 'Start Tour' : 'Mulai Petualangan'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ) : !loading && (
        <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.bottomInstructionCard}>
          <Feather name="navigation" size={20} color={colors.text} style={{ marginBottom: 12 }} />
          <Text style={styles.instructionTitle}>{t('mapStartExploration')}</Text>
          <Text style={styles.instructionDesc}>
            {markers.length > 0
              ? t('mapTapPrompt')
              : t('mapNoSites')}
          </Text>
        </Animated.View>
      )}

    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.card,
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
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  headerDesc: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: isDark ? "rgba(30, 41, 59, 0.8)" : "rgba(255,255,255,0.7)",
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
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
    backgroundColor: colors.text,
    borderWidth: 2,
    borderColor: colors.card,
  },
  bottomInstructionCard: {
    position: 'absolute',
    bottom: 100,
    width: width - 40,
    alignSelf: 'center',
    backgroundColor: colors.card,
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
    color: colors.text,
    marginBottom: 8,
  },
  instructionDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 100,
    width: width - 40,
    alignSelf: 'center',
    backgroundColor: colors.card,
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
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginRight: 16,
    lineHeight: 26,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  typePill: {
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  yearText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 4,
  },
  cardDesc: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: colors.card,
    fontSize: 15,
    fontWeight: '600',
  },
  routeSelectorContainer: {
    marginTop: 12,
    width: '100%',
  },
  routeScroll: {
    gap: 8,
    paddingRight: 20,
  },
  routePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  routePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  routePillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  routeNavigationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  routeNavigationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  routeNavigationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  routeNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  startRouteBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  }
});

