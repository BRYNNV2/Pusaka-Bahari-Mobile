import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, Layout, SlideInRight } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type GenealogyNode = {
  name: string;
  role?: string;
  relation: string;
  children?: GenealogyNode[];
};

export default function RajaAliHajiScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'bio' | 'tree'>('bio');

  const styles = getStyles(colors, isDark);

  // Genealogy Data
  const familyTree: GenealogyNode = {
    name: "Daeng Chelak",
    role: "Yang Dipertuan Muda Riau II",
    relation: "Kakek Buyut (Great-Grandfather)",
    children: [
      {
        name: "Raja Haji Fisabilillah",
        role: "Yang Dipertuan Muda Riau IV (Pahlawan Nasional)",
        relation: "Kakek (Grandfather)",
        children: [
          {
            name: "Raja Ahmad (Engku Haji Tua)",
            role: "YDM Riau VI (Penulis Sejarah)",
            relation: "Ayah (Father)",
            children: [
              {
                name: "Raja Ali Haji",
                role: "Pujangga & Pahlawan Nasional (Penulis Gurindam 12)",
                relation: "Tokoh Utama",
                children: [
                  {
                    name: "Raja Hasan",
                    role: "Pujangga Istana Riau",
                    relation: "Anak (Son)",
                  },
                  {
                    name: "Raja Khalid Hitam",
                    role: "Intelektual & Penulis Riau",
                    relation: "Anak (Son)",
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  const renderBio = () => {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.bioContainer}>
        {/* Quick Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="calendar-star" size={24} color={colors.primary} />
            <Text style={styles.infoCardLabel}>{language === 'en' ? 'Birth' : 'Lahir'}</Text>
            <Text style={styles.infoCardVal}>1808</Text>
            <Text style={styles.infoCardSub}>Selangor, Malaysia</Text>
          </View>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="calendar-remove" size={24} color={colors.primary} />
            <Text style={styles.infoCardLabel}>{language === 'en' ? 'Death' : 'Wafat'}</Text>
            <Text style={styles.infoCardVal}>1873</Text>
            <Text style={styles.infoCardSub}>P. Penyengat, Riau</Text>
          </View>
        </View>

        {/* Narrative Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Feather name="user" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>{language === 'en' ? 'Short Biography' : 'Riwayat Singkat'}</Text>
          </View>
          <Text style={styles.sectionBody}>
            {language === 'en' 
              ? "Raja Ali Haji bin Raja Ahmad (1808–1873) was a 19th-century Bugis-Malay historian, poet, and scholar. He was born in Selangor but spent most of his productive life on the historic island of Pulau Penyengat in Riau. He was crowned as a National Hero of Indonesia in 2004 for his profound contributions to the Indonesian language and Malay literature."
              : "Raja Ali Haji bin Raja Ahmad (1808–1873) adalah ulama, sejarawan, pujangga, dan tokoh intelektual Melayu-Bugis abad ke-19. Lahir di Selangor, beliau menghabiskan sebagian besar hidupnya di Pulau Penyengat, Kepulauan Riau. Beliau ditetapkan sebagai Pahlawan Nasional Indonesia pada tahun 2004 atas jasa-jasanya dalam merintis pembinaan bahasa Indonesia."}
          </Text>
        </View>

        {/* Famous Works Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Feather name="book-open" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>{language === 'en' ? 'Masterpieces' : 'Karya Agung'}</Text>
          </View>

          {/* Work 1 */}
          <View style={styles.workRow}>
            <View style={styles.workBullet}>
              <Text style={styles.workBulletText}>1</Text>
            </View>
            <View style={styles.workContent}>
              <Text style={styles.workTitle}>Gurindam Dua Belas (1847)</Text>
              <Text style={styles.workDesc}>
                {language === 'en'
                  ? "A masterpiece of Malay literature containing moral philosophy and Islamic counseling."
                  : "Karya puisi legendaris berisi nasihat moral, kepemimpinan, dan ketuhanan yang abadi."}
              </Text>
            </View>
          </View>

          {/* Work 2 */}
          <View style={styles.workRow}>
            <View style={styles.workBullet}>
              <Text style={styles.workBulletText}>2</Text>
            </View>
            <View style={styles.workContent}>
              <Text style={styles.workTitle}>Bustan al-Katibin (1857)</Text>
              <Text style={styles.workDesc}>
                {language === 'en'
                  ? "The guide of writers, constituting the first comprehensive grammar of the Malay language."
                  : "Kitab tata bahasa Melayu pertama yang disusun secara ilmiah dan terstruktur."}
              </Text>
            </View>
          </View>

          {/* Work 3 */}
          <View style={styles.workRow}>
            <View style={styles.workBullet}>
              <Text style={styles.workBulletText}>3</Text>
            </View>
            <View style={styles.workContent}>
              <Text style={styles.workTitle}>Tuhfat al-Nafis (1865)</Text>
              <Text style={styles.workDesc}>
                {language === 'en'
                  ? "A historical chronicle detailing Bugis and Malay alliance history across the region."
                  : "Kitab sejarah berharga mengenai asal-usul, perang, dan hubungan diplomatik Melayu-Bugis."}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderTreeNode = (node: GenealogyNode, depth = 0) => {
    const isMainTokoh = node.name === "Raja Ali Haji";

    return (
      <View key={node.name} style={styles.treeNodeContainer}>
        {/* Node Card */}
        <Animated.View 
          entering={SlideInRight.delay(depth * 100).duration(300)}
          style={[
            styles.treeCard,
            isMainTokoh && styles.mainTokohCard,
            { marginLeft: depth * 16 }
          ]}
        >
          <View style={styles.treeCardHeader}>
            <MaterialCommunityIcons 
              name={isMainTokoh ? "crown-outline" : "account-outline"} 
              size={18} 
              color={isMainTokoh ? "#fbbf24" : colors.primary} 
            />
            <Text style={[styles.treeCardName, isMainTokoh && styles.mainTokohName]}>
              {node.name}
            </Text>
          </View>
          {node.role && <Text style={styles.treeCardRole}>{node.role}</Text>}
          <Text style={styles.treeCardRelation}>{node.relation}</Text>
        </Animated.View>

        {/* Render Children */}
        {node.children && node.children.map((child) => (
          <View key={child.name} style={styles.childrenWrapper}>
            {/* Connector Line */}
            <View style={[styles.connectorLine, { left: (depth * 16) + 24 }]} />
            {renderTreeNode(child, depth + 1)}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={['top']} style={styles.safeHeader}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{language === 'en' ? 'Raja Ali Haji History' : 'Sejarah Raja Ali Haji'}</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroWrapper}>
          <Image 
            source={require('../assets/images/masjid_penyengat_1776493242751.jpg')} 
            style={styles.heroBg} 
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroMeta}>
            <Text style={styles.heroName}>Raja Ali Haji</Text>
            <Text style={styles.heroTitleDesc}>
              {language === 'en' ? 'Bapak Bahasa Indonesia & National Hero' : 'Bapak Bahasa Indonesia & Pahlawan Nasional'}
            </Text>
          </View>
        </View>

        {/* Tab Controls */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            onPress={() => setActiveTab('bio')}
            style={[styles.tabItem, activeTab === 'bio' && styles.tabItemActive]}
          >
            <Text style={[styles.tabLabel, activeTab === 'bio' && styles.tabLabelActive]}>
              {language === 'en' ? 'Biography' : 'Riwayat Hidup'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('tree')}
            style={[styles.tabItem, activeTab === 'tree' && styles.tabItemActive]}
          >
            <Text style={[styles.tabLabel, activeTab === 'tree' && styles.tabLabelActive]}>
              {language === 'en' ? 'Genealogy Lineage' : 'Silsilah Keturunan'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active Tab Content */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          {activeTab === 'bio' ? renderBio() : (
            <Animated.View entering={FadeIn.duration(400)} layout={Layout.springify()}>
              <Text style={styles.treeSectionTitle}>
                {language === 'en' ? 'Family Tree of Raja Ali Haji' : 'Silsilah Keluarga Raja Ali Haji'}
              </Text>
              <Text style={styles.treeSectionDesc}>
                {language === 'en' 
                  ? 'The Bugis-Malay ancestry lineage demonstrating how the title of Kings/Rulers connected to Raja Ali Haji.' 
                  : 'Silsilah keturunan bangsawan Melayu-Bugis dari pihak leluhur hingga putra-putra Raja Ali Haji.'}
              </Text>
              <View style={styles.treeRootWrapper}>
                {renderTreeNode(familyTree)}
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeHeader: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroWrapper: {
    width: width,
    height: 200,
    position: 'relative',
  },
  heroBg: {
    width: '100%',
    height: '100%',
  },
  heroMeta: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroTitleDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.background,
  },
  bioContainer: {
    flex: 1,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoCard: {
    width: (width - 56) / 2,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.04,
    shadowRadius: 4,
  },
  infoCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  infoCardVal: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  infoCardSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.04,
    shadowRadius: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  sectionBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'justify',
  },
  workRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  workBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  workBulletText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  workContent: {
    flex: 1,
  },
  workTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  workDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  treeSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  treeSectionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 20,
  },
  treeRootWrapper: {
    paddingLeft: 4,
    position: 'relative',
  },
  treeNodeContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  treeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    width: '90%',
  },
  mainTokohCard: {
    borderColor: '#fbbf24',
    borderWidth: 1.5,
    backgroundColor: isDark ? 'rgba(251, 191, 36, 0.05)' : '#fffbeb',
  },
  treeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  treeCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 6,
  },
  mainTokohName: {
    color: isDark ? '#fbbf24' : '#b45309',
  },
  treeCardRole: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  treeCardRelation: {
    fontSize: 10,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  childrenWrapper: {
    position: 'relative',
    paddingTop: 16,
  },
  connectorLine: {
    position: 'absolute',
    top: -16,
    bottom: 16,
    width: 2,
    backgroundColor: colors.border,
  },
});
