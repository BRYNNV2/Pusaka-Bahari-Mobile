import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type AgendaItem = {
  id: number;
  title: string;
  description: string;
  event_date: string;
};

export default function AgendaScreen() {
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
    if (!dateString) return 'Tanggal belum ditentukan';
    try {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      };
      return date.toLocaleDateString('id-ID', options);
    } catch {
      return dateString;
    }
  };

  const getDayAndMonth = (dateString: string) => {
    if (!dateString) return { day: '-', month: '-' };
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const monthStr = date.toLocaleDateString('id-ID', { month: 'short' });
      return { day, month: monthStr };
    } catch {
      return { day: '-', month: '-' };
    }
  };

  const renderAgendaItem = ({ item }: { item: AgendaItem }) => {
    const { day, month } = getDayAndMonth(item.event_date);
    
    return (
      <View style={styles.card}>
        <View style={styles.cardDateBox}>
          <Text style={styles.cardDateDay}>{day}</Text>
          <Text style={styles.cardDateMonth}>{month.toUpperCase()}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          
          <View style={styles.cardFooter}>
            <View style={styles.cardTimeRow}>
              <Feather name="clock" size={14} color="#64748b" />
              <Text style={styles.cardFooterText}>{formatDate(item.event_date)}</Text>
            </View>
            <TouchableOpacity style={styles.actBtn}>
              <Text style={styles.actBtnText}>Detail</Text>
            </TouchableOpacity>
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
            <Feather name="arrow-left" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Agenda & Acara</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Jadwal Kebudayaan</Text>
        <Text style={styles.heroSub}>
          Ikuti terus perkembangan festival, kajian, dan peringatan sejarah di Pusaka Bahari.
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Memuat jadwal agenda...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderAgendaItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Feather name="calendar" size={32} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>Belum ada agenda</Text>
              <Text style={styles.emptyDesc}>Saat ini tidak ada acara mendatang yang dijadwalkan.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerArea: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 14,
    color: '#64748b',
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
    color: '#94a3b8',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardDateDay: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardDateMonth: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3b82f6',
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
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
    color: '#64748b',
  },
  actBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actBtnText: {
    color: '#ffffff',
    fontSize: 11,
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
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
