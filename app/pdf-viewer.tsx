import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export default function PdfViewer() {
  const router = useRouter();
  const { url, title } = useLocalSearchParams<{ url: string; title: string }>();
  const [loading, setLoading] = useState(true);

  if (!url) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>URL Dokumen tidak ditemukan.</Text>
        <TouchableOpacity style={styles.backBtnError} onPress={() => router.back()}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Kembali</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Gunakan Google Docs Viewer untuk Android agar PDF bisa dirender inline oleh WebView
  // Untuk iOS, WebView bawaan sudah bisa render PDF dengan sempurna
  const viewerUrl = Platform.OS === 'android' 
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}` 
    : url;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="x" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Membaca Dokumen'}</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <View style={styles.webviewContainer}>
        <WebView 
          source={{ uri: viewerUrl }} 
          style={styles.webview} 
          onLoadEnd={() => setLoading(false)}
          scalesPageToFit={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#8B5E3C" />
              <Text style={styles.loaderText}>Menyiapkan penampil dokumen...</Text>
            </View>
          )}
        />
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#8B5E3C" />
            <Text style={styles.loaderText}>Memuat dokumen PDF...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerArea: { backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  webviewContainer: { flex: 1, position: 'relative' },
  webview: { flex: 1 },
  loaderContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', zIndex: 10 },
  loaderText: { marginTop: 12, fontSize: 14, color: '#94a3b8', fontWeight: '500' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorText: { fontSize: 16, color: '#64748b', marginBottom: 20 },
  backBtnError: { backgroundColor: '#0f172a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }
});
