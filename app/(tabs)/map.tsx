import { Feather } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActivityIndicator, Dimensions, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const { mode, isDark, colors } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const [activeSite, setActiveSite] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

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
      }
    } catch (e) {
      console.log('Error parsing Leaflet message:', e);
    }
  };

  const generateMapHtml = () => {
    const primaryColor = colors.primary;
    const routeCoords = markers.map(m => [m.latitude, m.longitude]);
    const routeCoordsJson = JSON.stringify(routeCoords);
    const markersJson = JSON.stringify(markers);

    // Choose CartoDB Voyager (light) or Dark Matter (dark) based on mode
    const tileUrl = isDark 
      ? 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
      : 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';

    const backgroundColor = isDark ? '#0f172a' : '#f8fafc';
    const markerBorderColor = isDark ? '#1e293b' : '#ffffff';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
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

          // Add Markers
          markers.forEach(m => {
            const icon = L.divIcon({
              className: '',
              html: '<div class="custom-marker"><div class="marker-dot"></div></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });

            L.marker([m.latitude, m.longitude], { icon })
              .addTo(map)
              .on('click', () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CLICK_MARKER', data: m }));
              });
          });

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
      </SafeAreaView>

      {/* Loading Overlay */}
      {loading && markers.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={styles.loadingText}>{t('mapLoadingSites')}</Text>
        </View>
      )}

      {/* Floating Bottom Info Sheet */}
      {activeSite ? (
        <Animated.View entering={FadeInUp.duration(400)} style={styles.bottomCard}>
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
            <TouchableOpacity onPress={() => setActiveSite(null)} style={styles.closeBtn}>
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
  }
});

