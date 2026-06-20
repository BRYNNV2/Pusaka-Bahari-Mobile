import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Calendar from 'expo-calendar';
import { Alert, Platform } from 'react-native';

const { width } = Dimensions.get('window');

type AgendaItem = {
  id: number;
  title: string;
  description: string;
  event_date: string;
  image_url?: string;
};

export default function AgendaScreen() {
  const { mode, isDark, colors } = useTheme();
  const { t, language } = useLanguage();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const [data, setData] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgenda();
  }, []);

  const fetchAgenda = async () => {
    setLoading(true);
    // Kita urutkan berdasarkan tanggal terdekat yang akan datang, atau secara ASC
    const { data: rows } = await supabase
      .from('agenda')
      .select('*')
      .order('event_date', { ascending: true }); // event terdekat lebih dulu

    setData(rows as AgendaItem[] | []);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return t('agendaNoDate');
    try {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      };
      return date.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', options);
    } catch {
      return dateString;
    }
  };

  const getDayAndMonth = (dateString: string) => {
    if (!dateString) return { day: '-', month: '-' };
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const monthStr = date.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { month: 'short' });
      return { day, month: monthStr };
    } catch {
      return { day: '-', month: '-' };
    }
  };

  const AgendaCard = ({ item }: { item: AgendaItem }) => {
    const { day, month } = getDayAndMonth(item.event_date);
    const [timeLeft, setTimeLeft] = useState('');
    const [isPast, setIsPast] = useState(false);

    useEffect(() => {
      const eventTime = new Date(item.event_date).getTime();

      const updateCountdown = () => {
        const now = new Date().getTime();
        const diff = eventTime - now;

        if (diff < 0) {
          setIsPast(true);
          setTimeLeft(t('agendaEnded'));
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeLeft(t('agendaDaysLeft').replace('{days}', String(days)).replace('{hours}', String(hours)).replace('{minutes}', String(minutes)).replace('{seconds}', String(seconds)));
        } else {
          setTimeLeft(t('agendaHoursLeft').replace('{hours}', String(hours)).replace('{minutes}', String(minutes)).replace('{seconds}', String(seconds)));
        }
      };

      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);
      return () => clearInterval(timer);
    }, [item.event_date]);

    const addToCalendar = async () => {
      try {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status === 'granted') {
          const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
          let defaultCalendar = calendars.find(c => c.isPrimary);
          if (!defaultCalendar && Platform.OS === 'ios') {
            defaultCalendar = calendars.find(c => c.source.name === 'Default');
          }
          if (!defaultCalendar && calendars.length > 0) {
            defaultCalendar = calendars[0];
          }

          if (defaultCalendar) {
            const startDate = new Date(item.event_date);
            const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Asumsi durasi 2 jam
            
            await Calendar.createEventAsync(defaultCalendar.id, {
              title: item.title,
              notes: item.description,
              startDate,
              endDate,
              timeZone: 'Asia/Jakarta',
              alarms: [{ relativeOffset: -60 }] // Ingatkan 1 jam sebelumnya
            });
            Alert.alert(t('success'), t('agendaAdded'));
          } else {
            Alert.alert(t('failed'), t('agendaNoCalendar'));
          }
        } else {
          Alert.alert(t('permissionDenied'), t('agendaPermission'));
        }
      } catch (error) {
        console.log('Error adding to calendar', error);
        Alert.alert(t('error'), t('agendaErrorAdd'));
      }
    };

    return (
      <View style={[styles.card, isPast && { opacity: 0.6 }]}>
        <View style={styles.cardDateBox}>
          <Text style={styles.cardDateDay}>{day}</Text>
          <Text style={styles.cardDateMonth}>{month.toUpperCase()}</Text>
        </View>
        <View style={styles.cardContent}>
          {item.image_url ? (
            <Image 
              source={{ uri: item.image_url }} 
              style={{ width: '100%', height: 160, borderRadius: 12, marginBottom: 12 }} 
              resizeMode="cover" 
            />
          ) : null}
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          
          <View style={styles.cardFooter}>
            <View style={{ flex: 1 }}>
              <View style={styles.cardTimeRow}>
                <Feather name="clock" size={14} color={colors.textSecondary} />
                <Text style={styles.cardFooterText}>{formatDate(item.event_date)}</Text>
              </View>
              <View style={[styles.cardTimeRow, { marginTop: 4 }]}>
                <Ionicons name="timer-outline" size={14} color={isPast ? "#ef4444" : "#c8956c"} />
                <Text style={[styles.cardFooterText, { color: isPast ? colors.danger : colors.primary, fontWeight: 'bold' }]}>
                  {timeLeft}
                </Text>
              </View>
            </View>

            {!isPast && (
              <TouchableOpacity style={styles.actBtn} onPress={addToCalendar}>
                <Feather name="calendar" size={14} color={colors.background} />
                <Text style={styles.actBtnText}>{t('remindMe')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('agendaHeader')}</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>{t('agendaHeroTitle')}</Text>
        <Text style={styles.heroSub}>
          {t('agendaHeroSub')}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <LottieView
            source={require('../assets/animations/Free Searching Animation.json')}
            autoPlay
            loop
            style={{ width: 150, height: 150 }}
          />
          <Text style={[styles.loadingText, { marginTop: 10 }]}>{t('agendaLoading')}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <AgendaCard item={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Feather name="calendar" size={32} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>{t('agendaEmptyTitle')}</Text>
              <Text style={styles.emptyDesc}>{t('agendaEmptyDesc')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  headerArea: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardDateBox: {
    width: 64,
    height: 72,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardDateDay: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  cardDateMonth: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  cardTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cardFooterText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  actBtn: {
    backgroundColor: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actBtnText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
