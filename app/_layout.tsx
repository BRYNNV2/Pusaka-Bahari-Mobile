import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function CustomDrawerContent(props: any) {
  const router = useRouter();
  const { isLoggedIn, userData, logout } = useAuth();

  return (
    <View style={styles.drawerContainer}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        
        {/* Profile Header section */}
        <View style={styles.profileSection}>
          <View style={styles.profileInfoWrap}>
             <View style={styles.avatarWrap}>
                {isLoggedIn && userData ? (
                  <Image source={{ uri: userData.profilePic }} style={styles.avatarImg} />
                ) : (
                  <View style={[styles.avatarImg, { backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }]}>
                    <Feather name="user" size={24} color="#94a3b8" />
                  </View>
                )}
             </View>
             <View style={styles.profileTextWrap}>
                <Text style={styles.profileName}>{isLoggedIn && userData ? userData.name : 'Pengguna Anonim'}</Text>
                <Text style={styles.profileEmail}>{isLoggedIn && userData ? userData.email : 'Tamu Belum Terverifikasi'}</Text>
                
                <View style={styles.progressWrap}>
                   <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: isLoggedIn ? '50%' : '5%' }]} />
                   </View>
                   <Text style={styles.progressText}>{isLoggedIn ? '50% profil lengkap' : 'Harap masuk untuk profil'}</Text>
                </View>
             </View>
          </View>
          
          <TouchableOpacity 
            style={isLoggedIn ? styles.guestBtn : styles.verifyBtn}
            onPress={() => { if (!isLoggedIn) router.push('/login'); }}
          >
             <Feather name={isLoggedIn ? "check-circle" : "alert-triangle"} size={14} color={isLoggedIn ? "#3b82f6" : "#059669"} />
             <Text style={isLoggedIn ? styles.guestText : styles.verifyText}>
               {isLoggedIn ? "Mode Penjelajahan Penuh" : "Selesaikan Tahap Verifikasi"}
             </Text>
          </TouchableOpacity>
        </View>

        {/* Custom Navigation Links */}
        <View style={styles.navSection}>
          <DrawerItem 
            label="Beranda Utama" 
            icon={({color, size}) => <Feather name="home" color={color} size={size} />}
            onPress={() => router.push('/')}
            labelStyle={styles.drawerLabel}
            activeTintColor="#059669"
            focused={true}
          />
          <DrawerItem 
            label="Koleksi Naskah" 
            icon={({color, size}) => <Feather name="book" color={color} size={size} />}
            onPress={() => router.push('/gallery')}
            labelStyle={styles.drawerLabel}
            activeTintColor="#0f172a"
          />
          <DrawerItem 
            label="Peta Pariwisata" 
            icon={({color, size}) => <Feather name="map" color={color} size={size} />}
            onPress={() => router.push('/map')}
            labelStyle={styles.drawerLabel}
            activeTintColor="#0f172a"
          />
          <DrawerItem 
            label="Profil Pengguna" 
            icon={({color, size}) => <Feather name="user" color={color} size={size} />}
            onPress={() => {}}
            labelStyle={styles.drawerLabel}
            activeTintColor="#0f172a"
          />
          <DrawerItem 
            label="Pengaturan Bahasa" 
            icon={({color, size}) => <Feather name="globe" color={color} size={size} />}
            onPress={() => {}}
            labelStyle={styles.drawerLabel}
            activeTintColor="#0f172a"
          />
          <DrawerItem 
            label={isLoggedIn ? "Keluar Aplikasi" : "Masuk Akun"} 
            icon={({color, size}) => <Feather name={isLoggedIn ? "log-out" : "log-in"} color={color} size={size} />}
            onPress={() => {
              if (isLoggedIn) {
                logout();
              } else {
                router.push('/login');
              }
            }}
            labelStyle={styles.drawerLabel}
            activeTintColor="#0f172a"
          />
        </View>

      </DrawerContentScrollView>

      {/* Social Media Footer */}
      <View style={styles.footerSection}>
         <Text style={styles.footerLabel}>Temukan kami di</Text>
         <View style={styles.socialWrap}>
            <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#eff6ff' }]}><FontAwesome5 name="facebook-f" size={16} color="#3b82f6" /></TouchableOpacity>
            <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#fdf2f8' }]}><FontAwesome5 name="instagram" size={16} color="#ec4899" /></TouchableOpacity>
            <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#fef2f2' }]}><FontAwesome5 name="youtube" size={16} color="#ef4444" /></TouchableOpacity>
         </View>
      </View>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Drawer
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={{
            headerShown: false, // Ensure main screens use their own headers
            drawerStyle: {
              width: 320,
              borderTopRightRadius: 32,
              borderBottomRightRadius: 32,
              overflow: 'hidden',
            },
          }}
        >
          <Drawer.Screen name="(tabs)" options={{ title: 'Beranda' }} />
          <Drawer.Screen name="login" options={{ title: 'Login', drawerItemStyle: { display: 'none' }, swipeEnabled: false }} />
          <Drawer.Screen name="modal" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="+not-found" options={{ drawerItemStyle: { display: 'none' } }} />
        </Drawer>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  profileSection: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  profileInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrap: {
    marginRight: 16,
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileTextWrap: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 8,
  },
  progressWrap: {
    width: '80%',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginBottom: 6,
  },
  progressFill: {
    width: '50%',
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  verifyText: {
    marginLeft: 8,
    color: '#059669',
    fontWeight: '700',
    fontSize: 13,
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  guestText: {
    marginLeft: 8,
    color: '#3b82f6',
    fontWeight: '700',
    fontSize: 13,
  },
  navSection: {
    paddingTop: 16,
    paddingHorizontal: 12,
  },
  drawerLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: -16,
  },
  footerSection: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  footerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  socialWrap: {
    flexDirection: 'row',
  },
  socialIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  }
});
