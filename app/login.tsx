import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type Tab = 'login' | 'register';

export default function LoginScreen() {
  const router = useRouter();
  const { login, register } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setConfirmPassword('');
    setErrorMsg('');
    setShowPass(false);
  };

  const handleTabSwitch = (tab: Tab) => {
    setActiveTab(tab);
    resetForm();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Email dan kata sandi wajib diisi.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    const { error } = await login(email.trim(), password);
    setIsLoading(false);
    if (error) {
      setErrorMsg(translateError(error));
    } else {
      router.replace('/');
    }
  };

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMsg('Semua kolom wajib diisi.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Kata sandi tidak cocok.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    const { error } = await register(email.trim(), password, fullName.trim());
    setIsLoading(false);
    if (error) {
      setErrorMsg(translateError(error));
    } else {
      Alert.alert(
        'Pendaftaran Berhasil!',
        'Akun berhasil dibuat. Silakan cek email Anda untuk konfirmasi, lalu masuk.',
        [{ text: 'OK', onPress: () => handleTabSwitch('login') }]
      );
    }
  };

  const handleGuest = () => {
    router.replace('/');
  };

  const translateError = (error: string): string => {
    if (error.includes('Invalid login credentials')) return 'Email atau kata sandi salah.';
    if (error.includes('Email not confirmed')) return 'Email belum dikonfirmasi. Cek kotak masuk Anda.';
    if (error.includes('User already registered')) return 'Email ini sudah terdaftar. Silakan masuk.';
    if (error.includes('Password should be')) return 'Kata sandi terlalu lemah.';
    if (error.includes('Unable to validate email')) return 'Format email tidak valid.';
    return error;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView bounces={false} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Cover Image */}
          <Animated.View entering={FadeIn.duration(800)} style={styles.imageWrap}>
            <Image
              source={require('../assets/images/masjid_penyengat_1776493242751.png')}
              style={styles.coverImage}
            />
            <View style={styles.imageOverlay} />
            <View style={styles.imageTitle}>
              <Feather name="anchor" size={20} color="#ffffff" />
              <Text style={styles.imageTitleText}>Pusaka Bahari</Text>
            </View>
          </Animated.View>

          <View style={styles.formArea}>

            {/* Tab Switcher */}
            <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'login' && styles.tabActive]}
                onPress={() => handleTabSwitch('login')}
              >
                <Text style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}>Masuk</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'register' && styles.tabActive]}
                onPress={() => handleTabSwitch('register')}
              >
                <Text style={[styles.tabText, activeTab === 'register' && styles.tabTextActive]}>Daftar</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Title */}
            <Animated.View entering={FadeInDown.duration(500).delay(150)}>
              <Text style={styles.title}>
                {activeTab === 'login' ? 'Selamat Kembali' : 'Buat Akun Baru'}
              </Text>
              <Text style={styles.subtitle}>
                {activeTab === 'login'
                  ? 'Masuk untuk mengakses koleksi naskah sejarah.'
                  : 'Bergabunglah dan jelajahi warisan budaya Melayu.'}
              </Text>
            </Animated.View>

            {/* Error Message */}
            {errorMsg ? (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color="#dc2626" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </Animated.View>
            ) : null}

            {/* Form Fields */}
            <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.inputGroup}>

              {activeTab === 'register' && (
                <View style={styles.inputContainer}>
                  <Feather name="user" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nama Lengkap"
                    placeholderTextColor="#94a3b8"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Feather name="mail" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Alamat Surel (Email)"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputContainer}>
                <Feather name="lock" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Kata Sandi"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Feather name={showPass ? 'eye-off' : 'eye'} size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {activeTab === 'register' && (
                <View style={styles.inputContainer}>
                  <Feather name="lock" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Konfirmasi Kata Sandi"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPass}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              )}

              {activeTab === 'login' && (
                <TouchableOpacity style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Lupa kata sandi?</Text>
                </TouchableOpacity>
              )}
            </Animated.View>

            {/* Submit Button */}
            <Animated.View entering={FadeInDown.duration(500).delay(300)}>
              <TouchableOpacity
                style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
                onPress={activeTab === 'login' ? handleLogin : handleRegister}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {activeTab === 'login' ? 'Masuk Akun' : 'Daftar Sekarang'}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Guest Mode Divider */}
            <Animated.View entering={FadeIn.duration(800).delay(400)}>
              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>ATAU</Text>
                <View style={styles.line} />
              </View>
              <TouchableOpacity style={styles.guestBtn} onPress={handleGuest}>
                <Text style={styles.guestBtnText}>Lanjutkan sebagai Tamu</Text>
                <Feather name="arrow-right" size={16} color="#475569" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </Animated.View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageWrap: {
    width: width,
    height: 220,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  imageTitle: {
    position: 'absolute',
    bottom: 24,
    left: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imageTitleText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  formArea: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 28,
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#0f172a',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    height: 54,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#0f172a',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  forgotText: {
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 13,
  },
  primaryBtn: {
    backgroundColor: '#0f172a',
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnDisabled: {
    backgroundColor: '#475569',
    elevation: 0,
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    color: '#94a3b8',
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  guestBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBtnText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '600',
  },
});
