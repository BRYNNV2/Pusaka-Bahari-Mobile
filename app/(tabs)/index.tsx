import React from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, Dimensions, StatusBar, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import Animated, { FadeInDown, FadeInUp, FadeIn, ZoomIn, SlideInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { isLoggedIn } = useAuth();

  const ActionButton = ({ icon, text, delay }: { icon: any, text: string, delay: number }) => (
    <Animated.View entering={ZoomIn.duration(400).delay(delay).springify()}>
      <TouchableOpacity style={styles.actionBtn}>
        <View style={styles.actionIconWrap}>
          <Feather name={icon} size={22} color="#0f172a" />
        </View>
        <Text style={styles.actionText}>{text}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      <ScrollView bounces={true} style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* Animated Hero Layout */}
        <Animated.View entering={FadeInDown.duration(800)} style={styles.heroSection}>
          <ImageBackground 
            source={require('../../assets/images/pusaka_bahari_banner_1776493187345.png')}
            style={styles.heroBackground}
          >
            <View style={styles.heroOverlay}>
              <SafeAreaView edges={['top']} style={styles.topNav}>
                <View style={styles.profileSection}>
                  <TouchableOpacity style={styles.avatar} onPress={() => navigation.dispatch(DrawerActions.openDrawer())} activeOpacity={0.8}>
                    <Feather name="menu" size={20} color="#0f172a" />
                  </TouchableOpacity>
                  <View>
                    <Text style={styles.appTitle}>Pusaka Bahari</Text>
                  </View>
                </View>
                {isLoggedIn ? (
                  <TouchableOpacity style={styles.iconButton}>
                    <Feather name="search" size={20} color="white" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }} onPress={() => router.push('/login')}>
                    <Text style={{ color: '#0f172a', fontWeight: 'bold' }}>Masuk</Text>
                  </TouchableOpacity>
                )}
              </SafeAreaView>

              <View style={styles.heroContent}>
                <Animated.Text entering={FadeIn.duration(800).delay(300)} style={styles.heroTitle}>Warisan{'\n'}Penyengat</Animated.Text>
                
                <Animated.View entering={FadeInUp.duration(600).delay(500)}>
                  <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/map')} activeOpacity={0.8}>
                     <Text style={styles.exploreBtnText}>Mulai Eksplorasi</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </ImageBackground>
        </Animated.View>

        {/* Minimalist Quick Actions Menu */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.quickActionsContainer}>
          <View style={styles.quickActions}>
            <ActionButton icon="map" text="Jalur Tur" delay={400} />
            <ActionButton icon="map-pin" text="Monumen" delay={500} />
            <ActionButton icon="file-text" text="Naskah" delay={600} />
            <ActionButton icon="clock" text="Linimasa" delay={700} />
          </View>
        </Animated.View>

        {/* Content Area */}
        <View style={styles.contentArea}>
          <Animated.Text entering={FadeIn.duration(500).delay(500)} style={styles.sectionTitle}>Eksplorasi Populer</Animated.Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            <Animated.View entering={SlideInRight.duration(600).delay(600).springify()}>
              <TouchableOpacity activeOpacity={0.9} style={styles.popularCard} onPress={() => router.push('/map')}>
                <Image 
                  source={require('../../assets/images/masjid_penyengat_1776493242751.png')}
                  style={styles.popularCardImg}
                />
                <View style={styles.popularCardTextWrap}>
                  <Text style={styles.popularCardTitle}>Masjid Raya Sultan Riau</Text>
                  <Text style={styles.popularCardDesc}>Seni arsitektur ikonis dengan putih telur.</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={SlideInRight.duration(600).delay(750).springify()}>
              <TouchableOpacity activeOpacity={0.9} style={styles.popularCard} onPress={() => router.push('/gallery')}>
                <Image 
                  source={require('../../assets/images/naskah_gurindam_1776493215711.png')}
                  style={styles.popularCardImg}
                />
                <View style={styles.popularCardTextWrap}>
                  <Text style={styles.popularCardTitle}>Gurindam Dua Belas</Text>
                  <Text style={styles.popularCardDesc}>Naskah agung syarat akan nasihat hidup.</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>

          <Animated.Text entering={FadeIn.duration(500).delay(600)} style={[styles.sectionTitle, { marginTop: 32 }]}>Kutipan Hari Ini</Animated.Text>
          <Animated.View entering={FadeInUp.duration(600).delay(800)}>
            <View style={styles.quoteCard}>
              <Feather name="book-open" size={24} color="#94a3b8" style={{ marginBottom: 12 }} />
              <Text style={styles.quoteText}>"Barang siapa mengenal diri, maka telah mengenal akan Tuhan yang bahri."</Text>
              <Text style={styles.quoteAuthor}>— Raja Ali Haji (Pasal 1)</Text>
            </View>
          </Animated.View>
          
          <Animated.Text entering={FadeIn.duration(500).delay(700)} style={[styles.sectionTitle, { marginTop: 32 }]}>Agenda Budaya</Animated.Text>
          <Animated.View entering={FadeInUp.duration(600).delay(900)}>
            <View style={styles.agendaCard}>
              <View style={styles.agendaDate}>
                   <Text style={styles.agendaMonth}>Okt</Text>
                   <Text style={styles.agendaDay}>25</Text>
              </View>
              <View style={styles.agendaInfo}>
                   <Text style={styles.agendaTitle}>Festival Pulau Penyengat</Text>
                   <Text style={styles.agendaDesc}>Pentas budaya dan tur naskah kuno.</Text>
              </View>
            </View>
          </Animated.View>

        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Clean white
  },
  scrollContainer: {
    flex: 1,
  },
  heroSection: {
    width: width,
    height: 400,
  },
  heroBackground: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)', // Simple subtle dark overlay for nice contrast
    justifyContent: 'space-between',
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  appTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    marginTop: 'auto',
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: 'white',
    lineHeight: 44,
    letterSpacing: -1,
    marginBottom: 24,
  },
  exploreBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8, // Sharp, professional corners
  },
  exploreBtnText: {
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 15,
  },
  quickActionsContainer: {
    marginTop: -20,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionBtn: {
    alignItems: 'center',
    width: 68,
  },
  actionIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
  },
  contentArea: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  horizontalScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  popularCard: {
    width: 260,
    marginRight: 16,
  },
  popularCardImg: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  popularCardTextWrap: {
    paddingRight: 8,
  },
  popularCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  popularCardDesc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  quoteCard: {
    backgroundColor: '#f8fafc',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quoteText: {
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 28,
    marginBottom: 16,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  agendaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  agendaDate: {
    width: 48,
    alignItems: 'center',
    marginRight: 16,
  },
  agendaMonth: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  agendaDay: {
    fontSize: 24,
    color: '#0f172a',
    fontWeight: '700',
  },
  agendaInfo: {
    flex: 1,
  },
  agendaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  agendaDesc: {
    fontSize: 14,
    color: '#64748b',
  }
});
