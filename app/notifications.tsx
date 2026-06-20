import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

type NotifItem = {
  id: number;
  title: string;
  message: string;
  type: string; // 'artifact', 'music', 'agenda', 'catalog', 'info'
  created_at: string;
};

const NOTIF_ICONS: Record<string, { name: string; lib: 'feather' | 'ionicons' | 'material'; color: string; bg: string }> = {
  artifact: { name: 'archive', lib: 'feather', color: '#8B5E3C', bg: '#fdf2e9' },
  music:    { name: 'musical-notes', lib: 'ionicons', color: '#6366f1', bg: '#eef2ff' },
  agenda:   { name: 'calendar', lib: 'feather', color: '#059669', bg: '#ecfdf5' },
  catalog:  { name: 'book-open', lib: 'feather', color: '#0891b2', bg: '#ecfeff' },
  info:     { name: 'bell', lib: 'feather', color: '#f59e0b', bg: '#fffbeb' },
};

export default function NotificationsScreen() {
  const { mode, isDark, colors } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);

  const fetchNotifications = async () => {
    setLoading(true);
    const uid = user?.id || 'guest';
    const userCreatedAt = user?.created_at || new Date().toISOString();

    // 1. Get hidden IDs from AsyncStorage
    const hiddenStr = await AsyncStorage.getItem(`hiddenNotifs_${uid}`);
    let hidden: number[] = hiddenStr ? JSON.parse(hiddenStr) : [];

    // 2. Merge with hidden IDs from Supabase Auth User Metadata if available
    if (user?.user_metadata?.hiddenNotifs) {
      const dbHidden = user.user_metadata.hiddenNotifs;
      if (Array.isArray(dbHidden)) {
        hidden = Array.from(new Set([...hidden, ...dbHidden]));
      }
    }
    setHiddenIds(hidden);

    // 3. Fetch notifications
    const { data: rows } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
    // 4. Filter out notifications created BEFORE user registered + those that are hidden
    const filtered = (rows as NotifItem[] || []).filter(n => {
      const isNewerThanUser = new Date(n.created_at) >= new Date(userCreatedAt);
      const isNotHidden = !hidden.includes(n.id);
      return isNewerThanUser && isNotHidden;
    });
    
    setData(filtered);
    setLoading(false);

    await AsyncStorage.setItem(`lastNotifRead_${uid}`, new Date().toISOString());
  };

  const deleteNotif = async (id: number) => {
    const uid = user?.id || 'guest';
    const newHidden = Array.from(new Set([...hiddenIds, id]));
    setHiddenIds(newHidden);
    setData(prev => prev.filter(n => n.id !== id));
    
    // Save to AsyncStorage
    await AsyncStorage.setItem(`hiddenNotifs_${uid}`, JSON.stringify(newHidden));

    // Sync to Supabase user metadata
    if (user) {
      await supabase.auth.updateUser({
        data: { hiddenNotifs: newHidden }
      }).catch(e => console.warn('Gagal sinkronisasi hapus notifikasi:', e));
    }
  };

  const clearAll = async () => {
    if (data.length === 0) return;
    Alert.alert(t('notifClearAlertTitle'), t('notifClearAlertDesc'), [
      { text: t('notifClearCancel'), style: 'cancel' },
      { text: t('notifClearConfirm'), onPress: async () => {
        const uid = user?.id || 'guest';
        const allIdsToHide = Array.from(new Set([...hiddenIds, ...data.map(n => n.id)]));
        setHiddenIds(allIdsToHide);
        setData([]);
        
        // Save to AsyncStorage
        await AsyncStorage.setItem(`hiddenNotifs_${uid}`, JSON.stringify(allIdsToHide));

        // Sync to Supabase user metadata
        if (user) {
          await supabase.auth.updateUser({
            data: { hiddenNotifs: allIdsToHide }
          }).catch(e => console.warn('Gagal sinkronisasi bersihkan notifikasi:', e));
        }
      }}
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const getTimeAgo = (dateString: string) => {
    const now = new Date().getTime();
    const date = new Date(dateString).getTime();
    const diff = now - date;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return t('notifJustNow');
    if (minutes < 60) return `${minutes} ${t('notifMinutesAgo')}`;
    if (hours < 24) return `${hours} ${t('notifHoursAgo')}`;
    if (days < 7) return `${days} ${t('notifDaysAgo')}`;
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderIcon = (type: string) => {
    const config = NOTIF_ICONS[type] || NOTIF_ICONS.info;
    return (
      <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : config.bg }]}>
        {config.lib === 'feather' && <Feather name={config.name as any} size={20} color={config.color} />}
        {config.lib === 'ionicons' && <Ionicons name={config.name as any} size={20} color={config.color} />}
        {config.lib === 'material' && <MaterialCommunityIcons name={config.name as any} size={20} color={config.color} />}
      </View>
    );
  };

  const renderItem = ({ item }: { item: NotifItem }) => (
    <View style={styles.card}>
      {renderIcon(item.type)}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.message ? <Text style={styles.cardMessage} numberOfLines={2}>{item.message}</Text> : null}
        <View style={styles.cardFooter}>
          <Text style={styles.cardTime}>{getTimeAgo(item.created_at)}</Text>
          <TouchableOpacity style={styles.delBtn} onPress={() => deleteNotif(item.id)}>
            <Feather name="x" size={14} color={colors.textSecondary} />
            <Text style={styles.delBtnText}>{t('notifDelete')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />

      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('notifTitle')}</Text>
          <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
            <Feather name="trash-2" size={20} color={data.length > 0 ? colors.danger : colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.centerWrap}>
          <LottieView
            source={require('../assets/animations/Free Searching Animation.json')}
            autoPlay
            loop
            style={{ width: 150, height: 150 }}
          />
          <Text style={[styles.loadingText, { marginTop: 10 }]}>{t('notifLoading')}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Feather name="bell-off" size={32} color={colors.border} />
              </View>
              <Text style={styles.emptyTitle}>{t('notifEmptyTitle')}</Text>
              <Text style={styles.emptyDesc}>{t('notifEmptyDesc')}</Text>
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  
  clearBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  delBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  delBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  cardTime: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
