import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function AppInfoScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const styles = getStyles(colors, isDark);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Informasi Aplikasi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo and Version */}
        <View style={styles.logoSection}>
          <View style={styles.logoFrame}>
            <Image 
              source={require('../assets/images/icon.png')} 
              style={styles.logoImage} 
              resizeMode="contain" 
            />
          </View>
          <Text style={appNameStyle(colors)}>RAHVerse</Text>
          <Text style={styles.appVersion}>Versi 1.0.0 (Build 26)</Text>
          <Text style={styles.appTagline}>Warisan Budaya & Pusaka Bahari Nusantara</Text>
        </View>

        {/* Detailed Info Cards */}
        <View style={styles.infoGroup}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pengembang</Text>
            <Text style={styles.infoValue}>Tim RAHVerse</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rilis Pertama</Text>
            <Text style={styles.infoValue}>Juni 2026</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kerangka Kerja</Text>
            <Text style={styles.infoValue}>Expo (React Native)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Database Cloud</Text>
            <Text style={styles.infoValue}>Supabase Security</Text>
          </View>
        </View>

        {/* Copyright Footer */}
        <View style={styles.footerSection}>
          <Text style={styles.copyrightText}>© 2026 RAHVerse. Hak Cipta Dilindungi.</Text>
          <Text style={styles.subCopyrightText}>Dibuat dengan rasa cinta terhadap warisan bahari Indonesia.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const appNameStyle = (colors: any) => ({
  fontSize: 24,
  fontWeight: '800' as const,
  color: colors.text,
  marginBottom: 4
});

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  
  scrollContent: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 30, alignItems: 'center' },
  
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoFrame: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: isDark ? colors.backgroundSecondary : '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16
  },
  logoImage: { width: 70, height: 70 },
  appVersion: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  appTagline: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  
  infoGroup: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 40
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16
  },
  infoLabel: { fontSize: 14, color: colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border },
  
  footerSection: { alignItems: 'center' },
  copyrightText: { fontSize: 13, color: colors.text, fontWeight: '600', marginBottom: 4 },
  subCopyrightText: { fontSize: 11, color: colors.textSecondary, textAlign: 'center' }
});
