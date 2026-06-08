import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

// FAQS is now defined inside the component

export default function HelpCenterScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const currentActiveCat = activeCategory || t('helpCatAll');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const styles = getStyles(colors, isDark);

  
  const FAQS = [
    { id: 1, question: t('faq1Q'), answer: t('faq1A'), category: t('helpCatAccount') },
    { id: 2, question: t('faq2Q'), answer: t('faq2A'), category: t('helpCatGallery') },
    { id: 3, question: t('faq3Q'), answer: t('faq3A'), category: t('helpCatBooks') },
    { id: 4, question: t('faq4Q'), answer: t('faq4A'), category: t('helpCatGeneral') },
    { id: 5, question: t('faq5Q'), answer: t('faq5A'), category: t('helpCatAccount') }
  ];

  const categories = [t('helpCatAll'), t('helpCatGeneral'), t('helpCatAccount'), t('helpCatBooks'), t('helpCatGallery')];

  const filteredFAQs = FAQS.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(search.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'ALL_CAT' || currentActiveCat === t('helpCatAll') || faq.category === currentActiveCat;
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const contactSupport = (method: 'whatsapp' | 'email') => {
    if (method === 'whatsapp') {
      Linking.openURL('https://wa.me/6281364014273?text=Halo%20Admin%20RAHVerse,%20saya%20membutuhkan%20bantuan...');
    } else {
      Linking.openURL('mailto:support@rahverse.com?subject=Bantuan%20Aplikasi%20RAHVerse');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('helpCenterTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Feather name="help-circle" size={48} color={colors.primary} style={styles.heroIcon} />
          <Text style={styles.heroTitle}>{t('helpHeroTitle')}</Text>
          <Text style={styles.heroSub}>{t('helpHeroSub')}</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('helpSearchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Categories Tab */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => { setActiveCategory(cat); setExpandedId(null); }}
              style={[styles.categoryBtn, currentActiveCat === cat && styles.categoryBtnActive]}
            >
              <Text style={[styles.categoryText, currentActiveCat === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FAQ List */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionTitle}>{t('helpPopular')}</Text>
          {filteredFAQs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="search" size={36} color={colors.textSecondary} />
              <Text style={styles.emptyText}>{t('helpEmpty')}</Text>
            </View>
          ) : (
            filteredFAQs.map((faq) => {
              const isExpanded = expandedId === faq.id;
              return (
                <View key={faq.id} style={styles.faqCard}>
                  <TouchableOpacity onPress={() => toggleExpand(faq.id)} style={styles.faqHeader} activeOpacity={0.7}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={styles.faqAnswerContainer}>
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Contact Admin */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>{t('helpContactTitle')}</Text>
          <Text style={styles.contactSub}>{t('helpContactSub')}</Text>
          <View style={styles.contactRow}>
            <TouchableOpacity onPress={() => contactSupport('whatsapp')} style={[styles.contactBtn, { backgroundColor: '#25D366' }]}>
              <FontAwesome name="whatsapp" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.contactBtnText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => contactSupport('email')} style={[styles.contactBtn, { backgroundColor: colors.primary }]}>
              <Feather name="mail" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.contactBtnText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  heroIcon: { marginBottom: 12 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
  heroSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },

  categoryScroll: { paddingHorizontal: 20, marginBottom: 20 },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    height: 38
  },
  categoryBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  categoryText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  categoryTextActive: { color: '#ffffff' },

  sectionGroup: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  
  faqCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden'
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16
  },
  faqQuestion: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1, marginRight: 12 },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12
  },
  faqAnswer: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: { marginTop: 8, fontSize: 13, color: colors.textSecondary },

  contactCard: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 20,
    alignItems: 'center'
  },
  contactTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 6 },
  contactSub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginBottom: 16, lineHeight: 16 },
  contactRow: { flexDirection: 'row', gap: 12 },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center'
  },
  contactBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' }
});
