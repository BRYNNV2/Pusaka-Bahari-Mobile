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
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
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

  const [profile, setProfile]     = useState<Profile | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const [fullName, setFullName] = useState('');
  const [bio, setBio]           = useState('');
  const [phone, setPhone]       = useState('');

  const [oldPassword, setOldPassword]         = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPass, setLoadingPass]         = useState(false);

  useEffect(() => {
    if (!isLoggedIn) router.replace('/login');
  }, [isLoggedIn]);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
      setProfile(data as Profile);
      setFullName(data.full_name ?? '');
      setBio(data.bio ?? '');
      setPhone(data.phone ?? '');
    }
    setLoading(false);
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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Curved Header Background with Faded Image */}
      <View style={styles.headerBackground}>
        <Image 
          source={require('../assets/images/masjid_penyengat_1776493242751.png')}
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

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitleBar}>Profil Akun</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Avatar & Profile Info Section */}
          <View style={styles.avatarSection}>
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
                <Feather name="camera" size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.profileNameTxt}>{fullName || 'Pengguna Anonim'}</Text>
            { isAdmin && (
              <View style={styles.adminBadge}>
                <MaterialCommunityIcons name="shield-star" size={14} color="#0f172a" />
                <Text style={styles.adminBadgeTxt}>Admin Terverifikasi</Text>
              </View>
            )}
            <Text style={styles.profileEmailTxt}>{user?.email}</Text>
            {phone ? <Text style={styles.profilePhoneTxt}>{phone}</Text> : null}
            {bio ? <Text style={styles.bioText}>"{bio}"</Text> : null}
            
            <View style={styles.actionRowBtn}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsEditing(true)} activeOpacity={0.8}>
                <Feather name="edit-3" size={14} color="#ffffff" />
                <Text style={styles.primaryBtnTxt}>Ubah Profil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setIsChangingPass(true)} activeOpacity={0.8}>
                <Feather name="lock" size={14} color="#0f172a" />
                <Text style={styles.secondaryBtnTxt}>Ubah Sandi</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Protection Card */}
          <View style={styles.sectionGroup}>
            <Text style={styles.sectionHeaderTxt}>Keamanan Data</Text>
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconWrap}>
                  <MaterialCommunityIcons name="shield-check" size={24} color="#0f172a" />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Status Perlindungan</Text>
                  <Text style={styles.cardSub}>Data terlindungi enkripsi</Text>
                </View>
                <Text style={styles.percentTxt}>Aman</Text>
              </View>
              
              <View style={styles.progressBarWrapper}>
                <View style={[styles.progressBarFill, { width: '100%' }]} />
              </View>
            </View>
          </View>

          {/* App Settings Group */}
          <View style={styles.sectionGroup}>
            <Text style={styles.sectionHeaderTxt}>Lainnya</Text>
            <View style={styles.menuCard}>
              <MenuRow icon="help-circle" title="Pusat Layanan" sub="Tanya jawab & bantuan pengguna" />
              <View style={styles.divider} />
              <MenuRow icon="file-text" title="Syarat Ketentuan" sub="Regulasi dan kebijakan data" />
              <View style={styles.divider} />
              <MenuRow icon="info" title="Informasi Aplikasi" sub="Versi 1.0.0 (Release)" />
            </View>
          </View>

          {/* Logout Button */}
          <View style={[styles.sectionGroup, { marginBottom: 40 }]}>
            <TouchableOpacity 
              style={styles.logoutBtn} 
              onPress={async () => { await logout(); router.replace('/login'); }}
              activeOpacity={0.8}
            >
              <Feather name="log-out" size={18} color="#ef4444" />
              <Text style={styles.logoutTxt}>Keluar Akun</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* Moda: Edit Profil */}
      {isEditing && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.overlayModal}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.bottomSheetWrapper}>
            <TouchableOpacity style={styles.sheetCloseBg} onPress={cancelEdit} activeOpacity={1} />
            <Animated.View entering={SlideInDown.duration(350)} style={styles.bottomSheet}>
              <View style={styles.dragIndicator} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Ubah Profil</Text>
                <TouchableOpacity onPress={cancelEdit}><Feather name="x" size={24} color="#64748b" /></TouchableOpacity>
              </View>
              
              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>Nama Lengkap</Text>
                <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Ketik nama lengkap..." placeholderTextColor="#94a3b8" />
              </View>
              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>Nomor Handphone</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Ketik nomor telpon aktif..." placeholderTextColor="#94a3b8" />
              </View>
              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>Informasi Singkat (Bio)</Text>
                <TextInput style={[styles.input, { height: 90, textAlignVertical: 'top' }]} value={bio} onChangeText={setBio} multiline placeholder="Tambahkan informasi singkat..." placeholderTextColor="#94a3b8" />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
                {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveBtnText}>Simpan Perubahan</Text>}
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
                <Text style={styles.sheetTitle}>Perbarui Sandi</Text>
                <TouchableOpacity onPress={() => setIsChangingPass(false)}><Feather name="x" size={24} color="#64748b" /></TouchableOpacity>
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>Sandi Lama</Text>
                <TextInput style={styles.input} value={oldPassword} onChangeText={setOldPassword} secureTextEntry placeholder="Ketik sandi saat ini..." placeholderTextColor="#94a3b8" />
              </View>
              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>Sandi Baru</Text>
                <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Ketik sandi baru..." placeholderTextColor="#94a3b8" />
              </View>
              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>Konfirmasi Sandi Baru</Text>
                <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Ketik ulang sandi baru..." placeholderTextColor="#94a3b8" />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdatePassword} disabled={loadingPass} activeOpacity={0.8}>
                {loadingPass ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveBtnText}>Perbarui Sandi</Text>}
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}

    </View>
  );
}

function MenuRow({ icon, title, sub, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuRow} activeOpacity={0.7}>
      <View style={styles.menuIconWrap}>
        <Feather name={icon} size={18} color="#0f172a" />
      </View>
      <View style={styles.menuTextContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {sub && <Text style={styles.menuSub}>{sub}</Text>}
      </View>
      <Feather name="chevron-right" size={18} color="#94a3b8" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfdfe' },
  headerBackground: { 
    position: 'absolute', 
    left: -(width * 2.5 - width) / 2, 
    top: -(width * 2.5 - (height * 0.22)), 
    width: width * 2.5, 
    height: width * 2.5, 
    borderRadius: (width * 2.5) / 2, 
    backgroundColor: '#0f172a', 
    overflow: 'hidden' 
  },
  safeArea: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitleBar: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingTop: height * 0.05 },
  
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 90, height: 90,
    borderRadius: 45,
    backgroundColor: '#ffffff',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    position: 'relative'
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 45 },
  avatarInisial: { width: '100%', height: '100%', borderRadius: 45, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#0f172a', fontSize: 32, fontWeight: '800' },
  uploadingOverlay: { position: 'absolute', width: '100%', height: '100%', borderRadius: 45, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  editAvatarBtn: {
    position: 'absolute',
    bottom: -2, right: -2,
    backgroundColor: '#0f172a',
    width: 30, height: 30,
    borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#ffffff',
  },
  
  profileNameTxt: { color: '#0f172a', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8, gap: 4 },
  adminBadgeTxt: { color: '#0f172a', fontSize: 11, fontWeight: '600' },
  profileEmailTxt: { color: '#64748b', fontSize: 13, fontWeight: '500', marginBottom: 2 },
  profilePhoneTxt: { color: '#64748b', fontSize: 13, fontWeight: '500', marginBottom: 8 },
  bioText: { color: '#0f172a', fontSize: 14, marginTop: 4, paddingHorizontal: 20, textAlign: 'center' },
  
  actionRowBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24, gap: 6 },
  primaryBtnTxt: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24, gap: 6 },
  secondaryBtnTxt: { color: '#0f172a', fontWeight: '700', fontSize: 13 },
  
  sectionGroup: { marginBottom: 24 },
  sectionHeaderTxt: { color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginLeft: 8 },
  
  card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardHeaderText: { flex: 1 },
  cardTitle: { color: '#0f172a', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  cardSub: { color: '#64748b', fontSize: 11, fontWeight: '500' },
  percentTxt: { color: '#0f172a', fontSize: 13, fontWeight: '700' },
  progressBarWrapper: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#0f172a', borderRadius: 3 },
  
  menuCard: { backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuTextContent: { flex: 1 },
  menuTitle: { color: '#0f172a', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  menuSub: { color: '#94a3b8', fontSize: 11 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 62 },
  
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', paddingVertical: 14, borderRadius: 16, gap: 8 },
  logoutTxt: { color: '#ef4444', fontWeight: '700', fontSize: 14 },

  // Modals
  overlayModal: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2, 6, 23, 0.5)', zIndex: 100 },
  bottomSheetWrapper: { flex: 1, justifyContent: 'flex-end' },
  sheetCloseBg: { ...StyleSheet.absoluteFillObject },
  bottomSheet: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  dragIndicator: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  sheetTitle: { color: '#0f172a', fontSize: 18, fontWeight: '800' },
  inputBox: { marginBottom: 16 },
  inputLabel: { color: '#475569', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, color: '#0f172a', fontSize: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  saveBtn: { backgroundColor: '#0f172a', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
});
