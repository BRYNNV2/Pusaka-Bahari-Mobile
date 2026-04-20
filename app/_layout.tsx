import React, { useState, useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// ─── Nav Item Component ───────────────────────────────────────────────────────
type NavItemProps = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  accent?: string;
  isActive?: boolean;
};

function NavItem({ icon, label, onPress, accent = '#475569', isActive = false }: NavItemProps) {
  return (
    <TouchableOpacity
      style={[styles.navItem, isActive && styles.navItemActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.navIconWrap, isActive && styles.navIconWrapActive]}>
        <Feather name={icon} size={18} color={isActive ? '#059669' : accent} />
      </View>
      <Text style={[styles.navLabel, isActive && styles.navLabelActive, { color: isActive ? '#059669' : accent }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Drawer Content ───────────────────────────────────────────────────────────
function CustomDrawerContent(props: any) {
  const router = useRouter();
  const { isLoggedIn, isAdmin, user, logout } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pengguna';
  const displayEmail = user?.email || 'Tamu Belum Terverifikasi';

  // Fetch avatar when logged in
  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    supabase.from('profiles').select('avatar_url').eq('id', user.id).single()
      .then(({ data }: { data: any }) => setAvatarUrl(data?.avatar_url ?? null));
  }, [user]);

  const closeAndGo = (path: string) => {
    props.navigation.closeDrawer();
    router.push(path as any);
  };

  return (
    <View style={styles.drawerContainer}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Header ── */}
        <View style={styles.profileSection}>
          {/* Avatar + Info */}
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              {isLoggedIn && avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : isLoggedIn ? (
                <Text style={styles.avatarLetter}>{displayName.charAt(0).toUpperCase()}</Text>
              ) : (
                <Feather name="user" size={22} color="#94a3b8" />
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {isLoggedIn ? displayName : 'Pengguna Anonim'}
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {isLoggedIn ? displayEmail : 'Belum masuk akun'}
              </Text>
            </View>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Feather name="shield" size={12} color="#059669" />
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: isLoggedIn ? '50%' : '5%' }]} />
            </View>
            <Text style={styles.progressText}>
              {isLoggedIn ? '50% profil lengkap' : 'Masuk untuk melengkapi profil'}
            </Text>
          </View>

          {/* Status Chip */}
          <TouchableOpacity
            style={[styles.statusChip, { backgroundColor: isLoggedIn ? '#eff6ff' : '#ecfdf5' }]}
            onPress={() => { if (!isLoggedIn) closeAndGo('/login'); }}
            activeOpacity={isLoggedIn ? 1 : 0.7}
          >
            <Feather
              name={isLoggedIn ? 'check-circle' : 'alert-circle'}
              size={13}
              color={isLoggedIn ? '#3b82f6' : '#059669'}
            />
            <Text style={[styles.statusChipText, { color: isLoggedIn ? '#3b82f6' : '#059669' }]}>
              {isLoggedIn ? 'Mode Penjelajahan Penuh' : 'Selesaikan Verifikasi'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Navigation ── */}
        <View style={styles.navSection}>
          <Text style={styles.navGroupLabel}>Menu Utama</Text>

          <NavItem icon="home"     label="Beranda"         onPress={() => closeAndGo('/')}        isActive />
          <NavItem icon="book"     label="Koleksi Naskah"  onPress={() => closeAndGo('/gallery')} />
          <NavItem icon="map"      label="Peta Pariwisata" onPress={() => closeAndGo('/map')}     />
          <NavItem icon="archive"  label="Katalog Arsip"   onPress={() => closeAndGo('/catalog')} />
          <NavItem icon="user"     label="Profil Pengguna" onPress={() => closeAndGo('/profile')}         />
          <NavItem icon="globe"    label="Bahasa"          onPress={() => {}}                     />

          {/* Divider */}
          <View style={styles.divider} />

          {isAdmin && (
            <NavItem
              icon="shield"
              label="Panel Admin"
              onPress={() => closeAndGo('/admin')}
              accent="#059669"
            />
          )}

          <NavItem
            icon={isLoggedIn ? 'log-out' : 'log-in'}
            label={isLoggedIn ? 'Keluar Akun' : 'Masuk Akun'}
            accent={isLoggedIn ? '#ef4444' : '#0f172a'}
            onPress={async () => {
              if (isLoggedIn) {
                await logout();
                router.replace('/login');
              } else {
                closeAndGo('/login');
              }
            }}
          />
        </View>
      </DrawerContentScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Temukan kami di</Text>
        <View style={styles.socialRow}>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#eff6ff' }]}>
            <FontAwesome5 name="facebook-f" size={14} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#fdf2f8' }]}>
            <FontAwesome5 name="instagram" size={14} color="#ec4899" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#fef2f2' }]}>
            <FontAwesome5 name="youtube" size={14} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Drawer
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={{
            headerShown: false,
            drawerStyle: {
              width: 300,
              borderTopRightRadius: 24,
              borderBottomRightRadius: 24,
              overflow: 'hidden',
            },
          }}
        >
          <Drawer.Screen name="(tabs)" options={{ title: 'Beranda' }} />
          <Drawer.Screen name="login"   options={{ drawerItemStyle: { display: 'none' }, swipeEnabled: false }} />
          <Drawer.Screen name="profile" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="admin"   options={{ drawerItemStyle: { display: 'none' }, swipeEnabled: false }} />
          <Drawer.Screen name="modal" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="+not-found" options={{ drawerItemStyle: { display: 'none' } }} />
        </Drawer>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  // Profile
  profileSection: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '400',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    flexShrink: 0,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  // Progress
  progressSection: {
    marginBottom: 14,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },

  // Status chip
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 8,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Nav
  navSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  navGroupLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cbd5e1',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
    gap: 14,
  },
  navItemActive: {
    backgroundColor: '#f0fdf4',
  },
  navIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  navIconWrapActive: {
    backgroundColor: '#dcfce7',
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  navLabelActive: {
    color: '#059669',
  },

  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 8,
    marginHorizontal: 4,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 12,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
  },
  socialBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
