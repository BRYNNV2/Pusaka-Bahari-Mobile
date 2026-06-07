import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function TermsScreen() {
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
        <Text style={styles.headerTitle}>Syarat & Ketentuan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Kebijakan Penggunaan</Text>
        <Text style={styles.lastUpdated}>Terakhir diperbarui: 6 Juni 2026</Text>

        <Text style={styles.paragraph}>
          Selamat datang di RAHVerse! Halaman Syarat & Ketentuan ini mengatur akses dan penggunaan Anda terhadap aplikasi seluler RAHVerse (selanjutnya disebut "Aplikasi").
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Penggunaan Aplikasi</Text>
          <Text style={styles.paragraph}>
            Aplikasi RAHVerse disediakan hanya untuk tujuan edukasi budaya, pelestarian warisan pusaka bahari, serta navigasi/pariwisata. Anda setuju untuk menggunakan aplikasi ini dengan bijak dan mematuhi peraturan hukum yang berlaku di Indonesia.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Akun & Keamanan Data</Text>
          <Text style={styles.paragraph}>
            Saat Anda mendaftar atau menggunakan akun Anda di RAHVerse, Anda bertanggung jawab penuh atas kerahasiaan kredensial login Anda. Database kami menggunakan enkripsi standar industri (Supabase Auth) untuk memastikan perlindungan terhadap data pribadi Anda.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Hak Kekayaan Intelektual</Text>
          <Text style={styles.paragraph}>
            Seluruh konten yang terdapat di dalam aplikasi ini, termasuk namun tidak terbatas pada data pusaka, artikel sejarah, buku digital (PDF), rekaman audio/lagu rakyat, dan antarmuka desain grafis merupakan hak milik RAHVerse atau kontributor berlisensi.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Kebijakan Privasi</Text>
          <Text style={styles.paragraph}>
            Kami tidak menjual atau membagikan data profil pribadi Anda (seperti nama lengkap, nomor telepon, dan bio) ke pihak ketiga. Data ini murni digunakan demi keperluan personalisasi pengalaman menjelajahi RAHVerse.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Modifikasi & Pembaruan Layanan</Text>
          <Text style={styles.paragraph}>
            Kami berhak untuk mengubah atau menghentikan sebagian atau seluruh fitur aplikasi kapan pun tanpa pemberitahuan terlebih dahulu demi pembaruan sistem dan keamanan yang lebih baik.
          </Text>
        </View>

        <Text style={styles.footnote}>
          Dengan menggunakan Aplikasi RAHVerse, Anda dianggap telah menyetujui seluruh ketentuan yang tercantum di atas. Jika Anda tidak menyetujui ketentuan ini, Anda dipersilakan untuk tidak menggunakan aplikasi ini.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
  lastUpdated: { fontSize: 12, color: colors.textSecondary, marginBottom: 16 },
  
  paragraph: { fontSize: 14, color: colors.text, lineHeight: 22, marginBottom: 12 },
  
  section: { marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  
  footnote: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', marginTop: 24, lineHeight: 18 }
});
