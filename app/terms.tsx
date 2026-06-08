import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TermsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const styles = getStyles(colors, isDark);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('termsHeaderTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('termsTitle')}</Text>
        <Text style={styles.lastUpdated}>{t('termsLastUpdated')}</Text>

        <Text style={styles.paragraph}>
          {t('termsIntro')}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('termsS1Title')}</Text>
          <Text style={styles.paragraph}>
            {t('termsS1Desc')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('termsS2Title')}</Text>
          <Text style={styles.paragraph}>
            {t('termsS2Desc')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('termsS3Title')}</Text>
          <Text style={styles.paragraph}>
            {t('termsS3Desc')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('termsS4Title')}</Text>
          <Text style={styles.paragraph}>
            {t('termsS4Desc')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('termsS5Title')}</Text>
          <Text style={styles.paragraph}>
            {t('termsS5Desc')}
          </Text>
        </View>

        <Text style={styles.footnote}>
          {t('termsFootnote')}
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
