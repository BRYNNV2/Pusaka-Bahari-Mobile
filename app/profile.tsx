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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

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

  // Edit profile state
  const [fullName, setFullName] = useState('');
  const [bio, setBio]           = useState('');
  const [phone, setPhone]       = useState('');

  // Password state
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
      // 1. Verifikasi password lama
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: user?.email!,
        password: oldPassword,
      });

      if (loginError) throw new Error('Kata sandi lama tidak sesuai.');

      // 2. Update ke yang baru (Tanpa melakukan re-fetch profile)
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
        // @ts-ignore
        assetTypes: ImagePicker.MediaTypeOptions.Images 
      };

      Alert.alert('Tips', 'Pilih foto dan klik "POTONG" atau centang di pojok kanan atas.', [{
        text: 'Oke, Pilih',
        onPress: async () => {
          const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
          if (!result.canceled && result.assets[0]) uploadAvatar(result.assets[0].uri);
        }
      }]);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const uploadAvatar = async (uri: string) => {
    if (!user) return;
    setUploading(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
      const arrayBuffer = decode(base64);
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/avatar_${Date.now()}.${ext}`;
      await supabase.storage.from('avatars').upload(path, arrayBuffer, { contentType: `image/${ext}`, upsert: true });
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;
      const { data: updatedData } = await supabase.from('profiles').upsert({ id: user.id, avatar_url: publicUrl }).select().single();
      if (updatedData) setProfile(updatedData as Profile);
      Alert.alert('Berhasil', 'Foto profil diperbarui!');
    } catch (e: any) { Alert.alert('Gagal', e.message); }
    finally { setUploading(false); }
  };

  if (loading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color="#00aa13" /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Feather name="arrow-left" size={24} color="#101418" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Pengaturan & keamanan</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.profileCard}>
          <View style={styles.profileRow}>
            <TouchableOpacity onPress={() => pickImage('gallery')} style={styles.avatarWrap}>
              {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} /> : <View style={styles.avatarInisial}><Text style={styles.avatarLetter}>{(fullName || 'U').charAt(0).toUpperCase()}</Text></View>}
              <View style={styles.editOverlay}><Feather name="plus" size={12} color="#fff" /></View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{fullName || 'Belum diatur'}</Text>
              <Text style={styles.profileSub}>{phone || 'Tanpa telepon'}</Text>
              <View style={styles.emailRow}><Text style={styles.profileSub}>{user?.email}</Text><MaterialCommunityIcons name="check-circle" size={14} color="#00aa13" style={{ marginLeft: 4 }} /></View>
              <TouchableOpacity onPress={() => setIsEditing(true)}><Text style={styles.gantiTxt}>Ganti profil</Text></TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.card}>
          <View style={styles.cardHeader}><Text style={styles.cardTitle}>Perlindungan akun</Text><MaterialCommunityIcons name="shield-check" size={28} color="#f1f5f9" /></View>
          <View style={styles.progressRow}><Text style={styles.percentText}>100%</Text><Feather name="arrow-right" size={16} color="#94a3b8" style={{ marginHorizontal: 8 }} /><Text style={styles.secureText}>Aman sentosa!</Text></View>
          <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: '100%' }]} /></View>
          <TouchableOpacity style={styles.safetyAction} onPress={() => setIsChangingPass(true)}>
            <View style={styles.safetyIcon}><MaterialCommunityIcons name="lock-reset" size={18} color="#00aa13" /></View>
            <Text style={styles.safetyText}>Ganti Kata Sandi Akun</Text>
            <Feather name="chevron-right" size={18} color="#00aa13" />
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.labelDivider}>PENGATURAN APLIKASI</Text>
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.listCard}>
          <MenuRow icon="settings" title="Ubah Profil & Data" sub="Update nama, bio, dan nomor teleponmu" onPress={() => setIsEditing(true)} />
          <View style={styles.divider} />
          <MenuRow icon="help-circle" title="Bantuan" sub="Kirim dan pantau laporanmu di sini" />
        </Animated.View>

        <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await logout(); router.replace('/login'); }}>
          <MaterialCommunityIcons name="logout" size={20} color="#ef4444" /><Text style={styles.logoutTxtBtn}>Keluar Akun</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal: Edit Profile */}
      {isEditing && (
        <Animated.View entering={FadeIn} style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
            <Animated.View entering={FadeInDown} style={styles.modalContent}>
              <View style={styles.dragBar} />
              <View style={styles.modalHeader}><Text style={styles.modalTitle}>Update Data Profil</Text><TouchableOpacity onPress={cancelEdit}><Feather name="x" size={20} color="#94a3b8" /></TouchableOpacity></View>
              <View style={styles.inputBox}><Text style={styles.inputLabel}>Nama Lengkap</Text><TextInput style={styles.input} value={fullName} onChangeText={setFullName} /></View>
              <View style={styles.inputBox}><Text style={styles.inputLabel}>Nomor Telepon</Text><TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" /></View>
              <View style={styles.inputBox}><Text style={styles.inputLabel}>Bio</Text><TextInput style={[styles.input, { height: 80 }]} value={bio} onChangeText={setBio} multiline /></View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Simpan Perubahan</Text>}</TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}

      {/* Modal: Change Password */}
      {isChangingPass && (
        <Animated.View entering={FadeIn} style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
            <Animated.View entering={FadeInDown} style={styles.modalContent}>
              <View style={styles.dragBar} />
              <View style={styles.modalHeader}><Text style={styles.modalTitle}>Ganti Kata Sandi</Text><TouchableOpacity onPress={() => setIsChangingPass(false)}><Feather name="x" size={20} color="#94a3b8" /></TouchableOpacity></View>
              <View style={styles.inputBox}><Text style={styles.inputLabel}>Kata Sandi Lama</Text><TextInput style={styles.input} value={oldPassword} onChangeText={setOldPassword} secureTextEntry /></View>
              <View style={styles.inputBox}><Text style={styles.inputLabel}>Kata Sandi Baru</Text><TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry /></View>
              <View style={styles.inputBox}><Text style={styles.inputLabel}>Konfirmasi Kata Sandi Baru</Text><TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry /></View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdatePassword} disabled={loadingPass}>{loadingPass ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Perbarui Kata Sandi</Text>}</TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}
    </View>
  );
}

function MenuRow({ icon, title, sub, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuRow}>
      <View style={styles.menuIconWrap}><Feather name={icon} size={18} color="#64748b" /></View>
      <View style={{ flex: 1 }}><Text style={styles.menuTitle}>{title}</Text>{sub && <Text style={styles.menuSub}>{sub}</Text>}</View>
      <Feather name="chevron-right" size={18} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfdfe' },
  safeTop: { backgroundColor: '#fcfdfe' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: '#0f172a', fontSize: 16, fontWeight: '700', marginLeft: 4 },
  body: { flex: 1, paddingHorizontal: 16 },
  profileCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginTop: 10, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { width: 70, height: 70, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f1f5f9', position: 'relative' },
  avatarImage: { width: '100%', height: '100%' },
  avatarInisial: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00aa13' },
  avatarLetter: { color: '#fff', fontSize: 28, fontWeight: '900' },
  editOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#00aa13', width: 20, height: 20, borderTopLeftRadius: 8, justifyContent: 'center', alignItems: 'center' },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { color: '#0f172a', fontSize: 18, fontWeight: '800', marginBottom: 2 },
  profileSub: { color: '#64748b', fontSize: 12, fontWeight: '500' },
  emailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  gantiTxt: { color: '#00aa13', fontSize: 12, fontWeight: '800', marginTop: 8 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginTop: 16, borderWidth: 1, borderColor: '#f1f5f9', elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { color: '#0f172a', fontSize: 14, fontWeight: '700' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  percentText: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
  secureText: { color: '#0f172a', fontSize: 14, fontWeight: '600' },
  progressBarBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#00aa13' },
  safetyAction: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 12, borderRadius: 16, marginTop: 18, borderWidth: 1, borderColor: '#dcfce7' },
  safetyIcon: { marginRight: 10 },
  safetyText: { flex: 1, color: '#00aa13', fontWeight: '700', fontSize: 13 },
  labelDivider: { color: '#94a3b8', fontSize: 10, fontWeight: '800', marginTop: 24, marginLeft: 4, marginBottom: 10, letterSpacing: 0.5 },
  listCard: { backgroundColor: '#fff', borderRadius: 24, paddingVertical: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  menuIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuTitle: { color: '#0f172a', fontSize: 14, fontWeight: '700' },
  menuSub: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, marginTop: 24, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#fee2e2' },
  logoutTxtBtn: { color: '#ef4444', fontWeight: '800', marginLeft: 10, fontSize: 14 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 },
  modalBg: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  dragBar: { width: 40, height: 5, backgroundColor: '#e2e8f0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { color: '#0f172a', fontSize: 18, fontWeight: '800' },
  inputBox: { marginBottom: 18 },
  inputLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, color: '#0f172a', fontSize: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  saveBtn: { backgroundColor: '#00aa13', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
