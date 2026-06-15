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
  LayoutAnimation,
  UIManager,
  Platform,
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
  bio?: string;
  children?: GenealogyNode[];
};

export default function RajaAliHajiScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'bio' | 'tree'>('bio');
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);

  // Enable LayoutAnimation on Android
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const toggleNode = (name: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedNodes(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const styles = getStyles(colors, isDark);

  // Genealogy Data
  const familyTree: GenealogyNode = {
    name: "Daeng Chelak",
    role: "Yang Dipertuan Muda Riau II",
    relation: "Kakek Buyut (Great-Grandfather)",
    bio: language === 'en'
      ? "Opu Daeng Chelak was a Bugis prince who became the second Yang Dipertuan Muda (Viceroy) of the Riau-Johor Empire. He established the Bugis political dynasty in the Malay world and laid the foundation for the Riau-Lingga Sultanate."
      : "Opu Daeng Chelak adalah pangeran Bugis yang menjadi Yang Dipertuan Muda (Wakil Sultan) Riau-Johor ke-2. Beliau mendirikan dinasti politik Bugis di dunia Melayu dan meletakkan dasar Kesultanan Riau-Lingga.",
    children: [
      {
        name: "Raja Haji Fisabilillah",
        role: "Yang Dipertuan Muda Riau IV (Pahlawan Nasional)",
        relation: "Kakek (Grandfather)",
        bio: language === 'en'
          ? "Raja Haji Fisabilillah (1727–1784) was a fearless Bugis-Malay warrior and the 4th Viceroy of Riau. He heroically fell in the Battle of Teluk Ketapang against the Dutch VOC in 1784, and was declared a National Hero of Indonesia in 1997."
          : "Raja Haji Fisabilillah (1727–1784) adalah panglima perang Bugis-Melayu dan Yang Dipertuan Muda Riau ke-4. Beliau gugur secara heroik dalam Pertempuran Teluk Ketapang melawan VOC Belanda tahun 1784, dan ditetapkan sebagai Pahlawan Nasional Indonesia tahun 1997.",
        children: [
          {
            name: "Raja Ahmad (Engku Haji Tua)",
            role: "YDM Riau VI (Penulis Sejarah)",
            relation: "Ayah (Father)",
            bio: language === 'en'
              ? "Raja Ahmad, known as Engku Haji Tua, was the 6th Viceroy of Riau and a prolific writer. He authored important historical texts and was instrumental in nurturing the literary talent of his son, Raja Ali Haji."
              : "Raja Ahmad, dikenal sebagai Engku Haji Tua, adalah Yang Dipertuan Muda Riau ke-6 dan penulis yang produktif. Beliau menulis teks-teks sejarah penting dan berperan besar dalam membina bakat sastra putranya, Raja Ali Haji.",
            children: [
              {
                name: "Raja Ali Haji",
                role: "Pujangga & Pahlawan Nasional (Penulis Gurindam 12)",
                relation: "Tokoh Utama",
                bio: language === 'en'
                  ? "Raja Ali Haji (1808–1873) is the central figure — a 19th-century Bugis-Malay scholar, historian, and poet. Author of Gurindam Dua Belas (1847), Tuhfat al-Nafis, and Bustan al-Katibin. Declared National Hero of Indonesia in 2004 as the Father of the Indonesian Language."
                  : "Raja Ali Haji (1808–1873) adalah tokoh utama — ulama, sejarawan, dan pujangga Melayu-Bugis abad ke-19. Penulis Gurindam Dua Belas (1847), Tuhfat al-Nafis, dan Bustan al-Katibin. Ditetapkan Pahlawan Nasional Indonesia tahun 2004 sebagai Bapak Bahasa Indonesia.",
                children: [
                  {
                    name: "Raja Hasan",
                    role: "Pujangga Istana Riau",
                    relation: "Anak (Son)",
                    bio: language === 'en'
                      ? "Raja Hasan was the son of Raja Ali Haji who continued his father's literary legacy as a court poet (pujangga) of the Riau-Lingga Sultanate."
                      : "Raja Hasan adalah putra Raja Ali Haji yang meneruskan warisan sastra ayahnya sebagai pujangga istana Kesultanan Riau-Lingga.",
                  },
                  {
                    name: "Raja Khalid Hitam",
                    role: "Intelektual & Penulis Riau",
                    relation: "Anak (Son)",
                    bio: language === 'en'
                      ? "Raja Khalid Hitam was an intellectual and writer from the Riau court who contributed to preserving and expanding upon the scholarly works of his father, Raja Ali Haji."
                      : "Raja Khalid Hitam adalah intelektual dan penulis dari istana Riau yang berkontribusi dalam melestarikan dan mengembangkan karya-karya ilmiah ayahnya, Raja Ali Haji.",
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
        {/* Unified Profile & Bio Card */}
        <View style={styles.sectionCard}>
          {/* Top Row: Photo + Quick Info */}
          <View style={styles.profileHeaderRow}>
            {/* Round Profile Photo */}
            <View style={styles.profileFrame}>
              <Image 
                source={require('../assets/images/raja_ali_haji_profile.webp')} 
                style={styles.profileImage}
                resizeMode="cover"
              />
            </View>

            {/* Quick Metadata */}
            <View style={styles.profileMeta}>
              <Text style={styles.profileNameText}>Raja Ali Haji</Text>
              <Text style={styles.profileTitleText}>
                {language === 'en' ? 'Father of Indonesian Language' : 'Bapak Bahasa Indonesia'}
              </Text>
              
              <View style={styles.metaInfoRow}>
                <MaterialCommunityIcons name="calendar-star" size={14} color={colors.primary} />
                <Text style={styles.metaInfoText}>
                  {language === 'en' ? 'Born: 1808 (Selangor)' : 'Lahir: 1808 (Selangor)'}
                </Text>
              </View>

              <View style={styles.metaInfoRow}>
                <MaterialCommunityIcons name="calendar-remove" size={14} color={colors.primary} />
                <Text style={styles.metaInfoText}>
                  {language === 'en' ? 'Died: 1873 (P. Penyengat)' : 'Wafat: 1873 (P. Penyengat)'}
                </Text>
              </View>
            </View>
          </View>

          {/* Divider Line */}
          <View style={styles.profileDivider} />

          {/* Narrative Text */}
          <View style={styles.sectionHeaderRow}>
            <Feather name="user" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>{language === 'en' ? 'Short Biography' : 'Riwayat Singkat'}</Text>
          </View>
          <Text style={styles.sectionBody}>
            {language === 'en' 
              ? "Raja Ali Haji bin Raja Ahmad (1808–1873) was a 19th-century Bugis-Malay historian, poet, and scholar. He spent most of his productive life on the historic island of Pulau Penyengat in Riau. He was crowned as a National Hero of Indonesia in 2004 for his profound contributions to the Indonesian language and Malay literature."
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
    const isExpanded = expandedNodes.includes(node.name);

    return (
      <View key={node.name} style={styles.treeNodeContainer}>
        {/* Row container holding the timeline circle and the card */}
        <View style={styles.treeNodeRow}>
          {/* Horizontal branch connector for child nodes */}
          {depth > 0 && <View style={styles.connectorHorizontal} />}
          
          {/* Timeline Circle Node */}
          <View style={[styles.timelineCircle, isMainTokoh && styles.timelineCircleMain]}>
            <MaterialCommunityIcons 
              name={isMainTokoh ? "crown" : "account"} 
              size={12} 
              color={isMainTokoh ? "#fbbf24" : "#ffffff"} 
            />
          </View>

          {/* Node Card */}
          <Animated.View 
            entering={SlideInRight.delay(depth * 100).duration(300)}
            style={[
              styles.treeCard,
              isMainTokoh && styles.mainTokohCard
            ]}
          >
            <TouchableOpacity activeOpacity={0.75} onPress={() => toggleNode(node.name)}>
              <View style={styles.treeCardHeader}>
                <Text style={[styles.treeCardName, isMainTokoh && styles.mainTokohName, { flex: 1 }]}>
                  {node.name}
                </Text>
                <Feather 
                  name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color={colors.textSecondary} 
                />
              </View>
              {node.role && <Text style={styles.treeCardRole}>{node.role}</Text>}
              <Text style={styles.treeCardRelation}>{node.relation}</Text>

              {/* Expandable Bio */}
              {isExpanded && node.bio && (
                <View style={styles.treeCardBioWrap}>
                  <View style={styles.treeCardBioDivider} />
                  <Text style={styles.treeCardBioText}>{node.bio}</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Render Children inside a wrapper with a left border line */}
        {node.children && node.children.map((child) => (
          <View key={child.name} style={styles.childrenWrapper}>
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
            source={require('../assets/images/sampulbiografi.webp')} 
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
    marginBottom: 6,
  },
  treeNodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  timelineCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  timelineCircleMain: {
    backgroundColor: '#fbbf24',
    shadowColor: '#fbbf24',
  },
  treeCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: 12,
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.04,
    shadowRadius: 4,
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
  treeCardBioWrap: {
    marginTop: 10,
  },
  treeCardBioDivider: {
    height: 1,
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    marginBottom: 10,
  },
  treeCardBioText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: 'justify',
  },
  childrenWrapper: {
    borderLeftWidth: 1.5,
    borderLeftColor: colors.border,
    marginLeft: 10,
    paddingLeft: 12,
    marginTop: 6,
    marginBottom: 6,
  },
  connectorHorizontal: {
    position: 'absolute',
    left: -12,
    top: 11,
    width: 12,
    height: 1.5,
    backgroundColor: colors.border,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileFrame: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fbbf24',
    overflow: 'hidden',
    backgroundColor: colors.card,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileMeta: {
    marginLeft: 16,
    flex: 1,
  },
  profileNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  profileTitleText: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '700',
    marginBottom: 6,
  },
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaInfoText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  profileDivider: {
    height: 1,
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    marginVertical: 14,
  },
});
