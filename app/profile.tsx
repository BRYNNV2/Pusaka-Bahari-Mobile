import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeIn, 
  SlideInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedScrollHandler, 
  interpolate, 
  Extrapolate,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { BlurView } from 'expo-blur';
import { supabase } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

type Profile = {
  id?: string;
  full_name: string;
  bio: string;
  phone: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const { mode, isDark, colors, setMode } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  
  const styles = getStyles(colors, isDark);


  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 80],
      [0, 1],
      Extrapolate.CLAMP
    );
    return {
      opacity: opacity,
    };
  });

  const [profile, setProfile]     = useState<Profile | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [expandedSetting, setExpandedSetting] = useState<string | null>(null);

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
  const [bio, setBio]           = useState('');
  const [phone, setPhone]       = useState('');

  const [oldPassword, setOldPassword]         = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPass, setLoadingPass]         = useState(false);

  const skeletonOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (!isLoggedIn) router.replace('/login');
  }, [isLoggedIn]);

  useEffect(() => {
    if (loading) {
      skeletonOpacity.value = withRepeat(
        withTiming(0.8, { duration: 800 }),
        -1,
        true
      );
    } else {
      skeletonOpacity.value = 1;
    }
  }, [loading]);

  const skeletonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: skeletonOpacity.value,
    };
  });

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error && error.code !== 'PGRST116') { // PGRST116 is code for no rows returned, which is fine for new users
        console.warn("Error fetching profile details:", error.message);
      }
      if (data) {
        setProfile(data as Profile);
        setFullName(data.full_name ?? (user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''));
        setBio(data.bio ?? '');
        setPhone(data.phone ?? '');
      }
    } catch (e: any) {
      console.warn("Exception during profile fetch:", e.message || e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName.trim(),
        bio: bio.trim(),
        phone: phone.trim()
      }).select().single();
      if (error) throw error;
      setProfile(data as Profile);
      setIsEditing(false);
      Alert.alert('Berhasil', 'Profil Anda telah diperbarui.');
    } catch (e: any) { Alert.alert('Gagal', e.message); }
    finally { setSaving(false); }
  };

  const handleUpdatePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) return Alert.alert('Input Kosong', 'Mohon isi semua kolom.');
    if (newPassword !== confirmPassword) return Alert.alert('Error', 'Konfirmasi password tidak cocok.');
    if (newPassword.length < 6) return Alert.alert('Terlalu Pendek', 'Minimal 6 karakter.');
    
    setLoadingPass(true);
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: user?.email!,
        password: oldPassword,
      });

      if (loginError) throw new Error('Kata sandi lama tidak sesuai.');

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      Alert.alert('Sukses', 'Kata sandi berhasil diperbarui!');
      setIsChangingPass(false);
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e: any) {
      Alert.alert('Gagal', e.message);
    } finally {
      setLoadingPass(false);
    }
  };

  const cancelEdit = () => {
    setFullName(profile?.full_name ?? '');
    setBio(profile?.bio ?? '');
    setPhone(profile?.phone ?? '');
    setIsEditing(false);
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      const { status } = source === 'camera' 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Izin Ditolak', 'Butuh izin akses foto.');
      
      const options: ImagePicker.ImagePickerOptions = {
        allowsEditing: true, 
        aspect: [1, 1],
        quality: 0.5,
        mediaTypes: ImagePicker.MediaTypeOptions.Images 
      };

      const result = source === 'camera' 
        ? await ImagePicker.launchCameraAsync(options) 
        : await ImagePicker.launchImageLibraryAsync(options);
        
      if (!result.canceled && result.assets[0]) uploadAvatar(result.assets[0].uri);

    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const uploadAvatar = async (uri: string) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/avatar_${Date.now()}.${ext}`;

      const formData = new FormData();
      formData.append('files', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: `avatar_${Date.now()}.${ext}`,
        type: `image/${ext}`,
      } as any);

      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, formData, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;
      const { data: updatedData, error: updateError } = await supabase.from('profiles').upsert({ id: user.id, avatar_url: publicUrl }).select().single();
      
      if (updateError) throw updateError;
      if (updatedData) setProfile(updatedData as Profile);
      
      Alert.alert('Berhasil', 'Foto profil diperbarui!');
    } catch (e: any) { 
      Alert.alert('Gagal', e.message || 'Terjadi kesalahan jaringan.'); 
    }
    finally { setUploading(false); }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? colors.background : '#0f172a' }]}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ marginTop: 16, color: '#94a3b8', fontSize: 14, fontWeight: '600', letterSpacing: 0.3 }}>
          Memuat Profil...
        </Text>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>

      {/* STICKY HEADER WITH DYNAMIC BACKGROUND */}
      <SafeAreaView edges={['top']} style={styles.absoluteHeader}>
        <Animated.View 
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? colors.backgroundSecondary : '#0f172a' },
            headerAnimatedStyle
          ]}
        />
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitleBar}>Profil Akun</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 20 }} 
        bounces={false} 
        style={{ flex: 1 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Curved Header Background with Faded Image */}
        <View style={styles.headerBackground}>
          <Image 
            source={require('../assets/images/masjid_penyengat_1776493242751.jpg')}
            style={{ 
              width: width, 
              height: height * 0.23, 
              position: 'absolute', 
              bottom: 0, 
              left: (width * 2.5 - width) / 2, 
              opacity: 0.25 
            }}
            resizeMode="cover"
          />
        </View>

        {/* Spacer to push content below the transparent header */}
        <SafeAreaView edges={['top']}>
          <View style={{ height: 60 }} />
        </SafeAreaView>

        <View style={styles.scrollContent}>
          
          {/* Avatar & Profile Info Section */}
          <View style={styles.avatarSection}>
            {loading ? (
              <View style={styles.avatarContainer}>
                <Animated.View style={[styles.skeleton, { width: 100, height: 100, borderRadius: 50 }, skeletonAnimatedStyle]} />
              </View>
            ) : (
              <View style={styles.avatarContainer}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarInisial}>
                    <Text style={styles.avatarLetter}>{(fullName || user?.email || 'U').charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                {uploading && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator color="#ffffff" size="small" />
                  </View>
                )}
                <TouchableOpacity onPress={() => pickImage('gallery')} style={styles.editAvatarBtn} disabled={uploading} activeOpacity={0.8}>
                  <Feather name="camera" size={14} color={colors.background} />
                </TouchableOpacity>
              </View>
            )}

            {loading ? (
              <View style={{ alignItems: 'center', marginTop: 16, width: '100%' }}>
                <Animated.View style={[styles.skeleton, { width: 160, height: 22, marginBottom: 8 }, skeletonAnimatedStyle]} />
                <Animated.View style={[styles.skeleton, { width: 180, height: 14, marginBottom: 8 }, skeletonAnimatedStyle]} />
                <Animated.View style={[styles.skeleton, { width: 120, height: 14, marginBottom: 8 }, skeletonAnimatedStyle]} />
                <Animated.View style={[styles.skeleton, { width: '80%', height: 16 }, skeletonAnimatedStyle]} />
              </View>
            ) : (
              <>
                <Text style={styles.profileNameTxt}>{fullName || 'Pengguna Anonim'}</Text>
                { isAdmin && (
                  <View style={styles.adminBadge}>
                    <MaterialCommunityIcons name="shield-star" size={14} color={colors.text} />
                    <Text style={styles.adminBadgeTxt}>Admin Terverifikasi</Text>
                  </View>
                )}
                <Text style={styles.profileEmailTxt}>{user?.email}</Text>
                {phone ? <Text style={styles.profilePhoneTxt}>{phone}</Text> : null}
                {bio ? <Text style={styles.bioText}>&quot;{bio}&quot;</Text> : null}
              </>
            )}
            
            <View style={styles.actionRowBtn}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsEditing(true)} activeOpacity={0.8} disabled={loading}>
                <Feather name="edit-3" size={14} color={colors.background} />
                <Text style={styles.primaryBtnTxt}>{t('editProfile')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setIsChangingPass(true)} activeOpacity={0.8} disabled={loading}>
                <Feather name="lock" size={14} color={colors.text} />
                <Text style={styles.secondaryBtnTxt}>{t('editPassword')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          

          {/* Koleksi Pribadi */}
          <View style={styles.sectionGroup}>
            <Text style={styles.sectionHeaderTxt}>{t('collections')}</Text>
            <View style={styles.menuCard}>
              <MenuRow 
                icon="bookmark" 
                title={t('savedGallery')} 
                sub={t('savedDesc')} 
                onPress={() => router.push('/collections')} 
              />
              <View style={styles.divider} />
              <MenuRow 
                icon="heart" 
                title={t('likedItems') || 'Disukai'} 
                sub={t('likedDesc') || 'Media yang Anda sukai'} 
                onPress={() => router.push('/likes')} 
              />
            </View>
          </View>

          {/* Account Protection Card */}
          <View style={styles.sectionGroup}>
            <Text style={styles.sectionHeaderTxt}>{t('security')}</Text>
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconWrap}>
                  <MaterialCommunityIcons name="shield-check" size={24} color={colors.text} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>{t('protection')}</Text>
                  <Text style={styles.cardSub}>{t('protected')}</Text>
                </View>
                <Text style={styles.percentTxt}>{t('safe')}</Text>
              </View>
              
              <View style={styles.progressBarWrapper}>
                <View style={[styles.progressBarFill, { width: '100%' }]} />
              </View>
            </View>
          </View>

          {/* Admin Menu */}
          {isAdmin && (
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionHeaderTxt}>{t('adminMenu')}</Text>
              <View style={styles.menuCard}>
                <MenuRow 
                  icon="database" 
                  title={t('manageAdmin')} 
                  sub={t('manageAdminDesc')} 
                  onPress={() => router.push('/admin')} 
                />
              </View>
            </View>
          )}

          {/* App Settings Group */}
          <View style={styles.sectionGroup}>
            <Text style={styles.sectionHeaderTxt}>{t('others')}</Text>
            <View style={styles.menuCard}>
              
              {/* Theme Dropdown */}
              <MenuRow 
                icon={mode === 'light' ? 'sun' : mode === 'dark' ? 'moon' : 'smartphone'} 
                title={t('theme')} 
                sub={mode === 'light' ? t('light') : mode === 'dark' ? t('dark') : t('system')} 
                rightIcon={expandedSetting === 'theme' ? 'chevron-up' : 'chevron-down'}
                onPress={() => setExpandedSetting(expandedSetting === 'theme' ? null : 'theme')} 
              />
              {expandedSetting === 'theme' && (
                <View style={{ backgroundColor: colors.backgroundSecondary, paddingHorizontal: 20, paddingVertical: 8 }}>
                  <TouchableOpacity onPress={() => { setMode('light'); setExpandedSetting(null); }} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Text style={{ color: mode === 'light' ? colors.primary : colors.text, fontWeight: mode === 'light' ? 'bold' : 'normal' }}>☀️  {t('light')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setMode('dark'); setExpandedSetting(null); }} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Text style={{ color: mode === 'dark' ? colors.primary : colors.text, fontWeight: mode === 'dark' ? 'bold' : 'normal' }}>🌙  {t('dark')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setMode('system'); setExpandedSetting(null); }} style={{ paddingVertical: 12 }}>
                    <Text style={{ color: mode === 'system' ? colors.primary : colors.text, fontWeight: mode === 'system' ? 'bold' : 'normal' }}>📱  {t('system')}</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.divider} />

              {/* Language Dropdown */}
              <MenuRow 
                icon="globe" 
                title={t('language')} 
                sub={language === 'id' ? 'Bahasa Indonesia' : 'English'} 
                rightIcon={expandedSetting === 'language' ? 'chevron-up' : 'chevron-down'}
                onPress={() => setExpandedSetting(expandedSetting === 'language' ? null : 'language')} 
              />
              {expandedSetting === 'language' && (
                <View style={{ backgroundColor: colors.backgroundSecondary, paddingHorizontal: 20, paddingVertical: 8 }}>
                  <TouchableOpacity onPress={() => { setLanguage('id'); setExpandedSetting(null); }} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Text style={{ color: language === 'id' ? colors.primary : colors.text, fontWeight: language === 'id' ? 'bold' : 'normal' }}>🇮🇩  Bahasa Indonesia</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setLanguage('en'); setExpandedSetting(null); }} style={{ paddingVertical: 12 }}>
                    <Text style={{ color: language === 'en' ? colors.primary : colors.text, fontWeight: language === 'en' ? 'bold' : 'normal' }}>🇬🇧  English</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.divider} />

              <MenuRow 
                icon="help-circle" 
                title={t('helpCenter')} 
                sub={t('helpCenterDesc')} 
                onPress={() => router.push('/help-center')}
              />
              <View style={styles.divider} />
              <MenuRow 
                icon="file-text" 
                title={t('terms')} 
                sub={t('termsDesc')} 
                onPress={() => router.push('/terms')}
              />
              <View style={styles.divider} />
              <MenuRow 
                icon="info" 
                title={t('appInfo')} 
                sub={t('appInfoDesc')} 
                onPress={() => router.push('/app-info')}
              />
            </View>
          </View>

          {/* Logout Button */}
          <View style={[styles.sectionGroup, { marginBottom: 0 }]}>
            <TouchableOpacity 
              style={styles.logoutBtn} 
              onPress={async () => { 
                await import('@react-native-async-storage/async-storage').then(m => m.default.setItem('force_login_tab', 'true'));
                await logout(); 
                router.replace('/login'); 
              }}
              activeOpacity={0.8}
            >
              <Feather name="log-out" size={18} color="#ef4444" />
              <Text style={styles.logoutTxt}>{t('logout')}</Text>
            </TouchableOpacity>
          </View>

          </View>
        </Animated.ScrollView>

      {/* Moda: Edit Profil */}
      {isEditing && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.overlayModal}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.bottomSheetWrapper}>
            <TouchableOpacity style={styles.sheetCloseBg} onPress={cancelEdit} activeOpacity={1} />
            <Animated.View entering={SlideInDown.duration(350)} style={styles.bottomSheet}>
              <View style={styles.dragIndicator} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{t('profModalEditTitle')}</Text>
                <TouchableOpacity onPress={cancelEdit}><Feather name="x" size={24} color="#64748b" /></TouchableOpacity>
              </View>
              
              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>{t('profModalFullName')}</Text>
                <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder={t('profModalFullNamePlaceholder')} placeholderTextColor="#94a3b8" />
              </View>
              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>{t('profModalPhone')}</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder={t('profModalPhonePlaceholder')} placeholderTextColor="#94a3b8" />
              </View>
              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>{t('profModalBio')}</Text>
                <TextInput style={[styles.input, { height: 90, textAlignVertical: 'top' }]} value={bio} onChangeText={setBio} multiline placeholder={t('profModalBioPlaceholder')} placeholderTextColor="#94a3b8" />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
                {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveBtnText}>{t('profModalSave')}</Text>}
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}

      {/* Modal: Ubah Sandi */}
      {isChangingPass && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.overlayModal}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.bottomSheetWrapper}>
            <TouchableOpacity style={styles.sheetCloseBg} onPress={() => setIsChangingPass(false)} activeOpacity={1} />
            <Animated.View entering={SlideInDown.duration(350)} style={styles.bottomSheet}>
              <View style={styles.dragIndicator} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{t('profModalPassTitle')}</Text>
                <TouchableOpacity onPress={() => setIsChangingPass(false)}><Feather name="x" size={24} color="#64748b" /></TouchableOpacity>
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>{t('profModalOldPass')}</Text>
                <TextInput style={styles.input} value={oldPassword} onChangeText={setOldPassword} secureTextEntry placeholder={t('profModalOldPassPlaceholder')} placeholderTextColor="#94a3b8" />
              </View>
              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>{t('profModalNewPass')}</Text>
                <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder={t('profModalNewPassPlaceholder')} placeholderTextColor="#94a3b8" />
              </View>
              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>{t('profModalConfirmPass')}</Text>
                <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder={t('profModalConfirmPassPlaceholder')} placeholderTextColor="#94a3b8" />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdatePassword} disabled={loadingPass} activeOpacity={0.8}>
                {loadingPass ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveBtnText}>{t('profModalPassTitle')}</Text>}
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}

    </View>
    </Animated.View>
  );
}

function MenuRow({ icon, title, sub, onPress, rightIcon = "chevron-right" }: any) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }} activeOpacity={0.7}>
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
        <Feather name={icon} size={18} color={colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 2 }}>{title}</Text>
        {sub && <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{sub}</Text>}
      </View>
      <Feather name={rightIcon} size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerBackground: { 
    position: 'absolute', 
    left: -(width * 2.5 - width) / 2, 
    top: -(width * 2.5 - (height * 0.22)), 
    width: width * 2.5, 
    height: width * 2.5, 
    borderRadius: (width * 2.5) / 2, 
    backgroundColor: isDark ? colors.backgroundSecondary : '#0f172a', 
    overflow: 'hidden' 
  },
  safeArea: { flex: 1 },
  absoluteHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitleBar: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingTop: height * 0.05 },
  skeleton: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    borderRadius: 8,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 90, height: 90,
    borderRadius: 45,
    backgroundColor: colors.card,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    position: 'relative'
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 45 },
  avatarInisial: { width: '100%', height: '100%', borderRadius: 45, backgroundColor: colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: colors.text, fontSize: 32, fontWeight: '800' },
  uploadingOverlay: { position: 'absolute', width: '100%', height: '100%', borderRadius: 45, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  editAvatarBtn: {
    position: 'absolute',
    bottom: -2, right: -2,
    backgroundColor: colors.text,
    width: 30, height: 30,
    borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.background,
  },
  
  profileNameTxt: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundSecondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8, gap: 4 },
  adminBadgeTxt: { color: colors.text, fontSize: 11, fontWeight: '600' },
  profileEmailTxt: { color: colors.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 2 },
  profilePhoneTxt: { color: colors.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 8 },
  bioText: { color: colors.text, fontSize: 14, marginTop: 4, paddingHorizontal: 20, textAlign: 'center' },
  
  actionRowBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.text, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24, gap: 6 },
  primaryBtnTxt: { color: colors.background, fontWeight: '700', fontSize: 13 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundSecondary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24, gap: 6 },
  secondaryBtnTxt: { color: colors.text, fontWeight: '700', fontSize: 13 },
  
  sectionGroup: { marginBottom: 24 },
  sectionHeaderTxt: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginLeft: 8 },
  
  themeSelectorRow: { flexDirection: 'row', backgroundColor: colors.backgroundSecondary, borderRadius: 16, padding: 4 },
  themeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, gap: 6 },
  themeBtnActive: { backgroundColor: colors.text, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  themeBtnTxt: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  themeBtnTxtActive: { color: colors.background },

  card: { backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardHeaderText: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  cardSub: { color: colors.textSecondary, fontSize: 11, fontWeight: '500' },
  percentTxt: { color: colors.text, fontSize: 13, fontWeight: '700' },
  progressBarWrapper: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.text, borderRadius: 3 },
  
  menuCard: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 62 },
  
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2', paddingVertical: 14, borderRadius: 16, gap: 8 },
  logoutTxt: { color: colors.danger, fontWeight: '700', fontSize: 14 },

  // Modals
  overlayModal: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 100 },
  bottomSheetWrapper: { flex: 1, justifyContent: 'flex-end' },
  sheetCloseBg: { ...StyleSheet.absoluteFillObject },
  bottomSheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  dragIndicator: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  sheetTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  inputBox: { marginBottom: 16 },
  inputLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: colors.backgroundSecondary, borderRadius: 12, padding: 16, color: colors.text, fontSize: 14, borderWidth: 1, borderColor: colors.border },
  saveBtn: { backgroundColor: colors.text, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: colors.background, fontWeight: '800', fontSize: 14 },
});
