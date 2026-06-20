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
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, FadeInUp } from 'react-native-reanimated';
import { CustomToastManager as Toast } from '@/components/CustomToast';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

type Tab = 'welcome' | 'login' | 'register';

export default function LoginScreen() {
  const { isDark, colors } = useTheme();
  const router = useRouter();
  const { login, register, resetPassword } = useAuth();
  const { t } = useLanguage();

  const primaryBlue = '#8B5E3C'; // RAHVerse Brown
  const primaryDarkBlue = '#5A3D27'; // Darker Brown

  const [activeTab, setActiveTab] = useState<Tab>('welcome');
  const [isInitializingTab, setIsInitializingTab] = useState(true);

  React.useEffect(() => {
    import('@react-native-async-storage/async-storage').then(m => {
      m.default.getItem('force_login_tab').then(val => {
        if (val === 'true') {
          setActiveTab('login');
          m.default.removeItem('force_login_tab');
        }
        setIsInitializingTab(false);
      });
    });
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [agreed, setAgreed] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setConfirmPassword('');
    setErrorMsg('');
    setShowPass(false);
    setAgreed(false);
  };

  const handleTabSwitch = (tab: Tab) => {
    setActiveTab(tab);
    resetForm();
  };
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (activeTab !== 'welcome') {
          handleTabSwitch('welcome');
        } else {
          BackHandler.exitApp();
        }
        return true; // Prevent default back action
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => backHandler.remove();
    }, [activeTab])
  );

  const translateError = (err: any) => {
    const msg = err?.message || '';
    if (msg.includes('Invalid login credentials')) return t('loginErrCred');
    if (msg.includes('Email not confirmed')) return t('loginErrConfirm');
    if (msg.includes('already registered')) return t('loginErrReg');
    return msg;
  };

  const handleLogin = async () => {
    // Light haptic impact on button press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (!email || !password) {
      const msg = t('loginErrEmailPass') || 'Email dan password harus diisi';
      setErrorMsg(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({ type: 'error', text1: 'Gagal Login', text2: msg, position: 'top', visibilityTime: 4000 });
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { error } = await login(email.trim(), password);
      if (error) {
        const msg = translateError(error);
        setErrorMsg(msg);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        Toast.show({ type: 'error', text1: 'Gagal Login', text2: msg, position: 'top', visibilityTime: 4000 });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Terjadi kesalahan jaringan');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({ type: 'error', text1: 'Gagal Login', text2: e.message || 'Terjadi kesalahan jaringan', position: 'top', visibilityTime: 4000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    // Light haptic impact on button press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (!fullName || !email || !password || !confirmPassword) {
      const msg = t('loginErrAllField') || 'Semua kolom harus diisi';
      setErrorMsg(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({ type: 'error', text1: 'Pendaftaran Gagal', text2: msg, position: 'top', visibilityTime: 4000 });
      return;
    }
    if (password !== confirmPassword) {
      const msg = t('loginErrMatch') || 'Password tidak cocok';
      setErrorMsg(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({ type: 'error', text1: 'Pendaftaran Gagal', text2: msg, position: 'top', visibilityTime: 4000 });
      return;
    }
    if (password.length < 6) {
      const msg = t('loginErrLength') || 'Password minimal 6 karakter';
      setErrorMsg(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({ type: 'error', text1: 'Pendaftaran Gagal', text2: msg, position: 'top', visibilityTime: 4000 });
      return;
    }
    if (!agreed) {
      const msg = 'Anda harus menyetujui Syarat & Ketentuan';
      setErrorMsg(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({ type: 'error', text1: 'Pendaftaran Gagal', text2: msg, position: 'top', visibilityTime: 4000 });
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { error } = await register(email.trim(), password, fullName.trim());
      if (error) {
        const msg = translateError(error);
        setErrorMsg(msg);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        Toast.show({ type: 'error', text1: 'Pendaftaran Gagal', text2: msg, position: 'top', visibilityTime: 4000 });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Toast.show({
          type: 'success',
          text1: t('loginRegSuccessTitle') || 'Berhasil',
          text2: t('loginRegSuccessDesc') || 'Akun berhasil dibuat. Silakan login.',
          position: 'top',
          visibilityTime: 5000,
        });
        handleTabSwitch('login');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Terjadi kesalahan jaringan');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({ type: 'error', text1: 'Pendaftaran Gagal', text2: e.message || 'Terjadi kesalahan jaringan', position: 'top', visibilityTime: 4000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    // Light haptic impact on button press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (!email) {
      const msg = 'Silakan isi email Anda terlebih dahulu untuk mereset kata sandi';
      setErrorMsg(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({ type: 'error', text1: 'Email Kosong', text2: msg, position: 'top', visibilityTime: 4000 });
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { error } = await resetPassword(email.trim());
      if (error) {
        const msg = translateError({ message: error });
        setErrorMsg(msg);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        Toast.show({ type: 'error', text1: 'Gagal Kirim Tautan', text2: msg, position: 'top', visibilityTime: 4000 });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Toast.show({ type: 'success', text1: 'Tautan Terkirim', text2: 'Silakan periksa email Anda untuk mereset kata sandi.', position: 'top', visibilityTime: 5000 });
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Terjadi kesalahan jaringan');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({ type: 'error', text1: 'Gagal Kirim Tautan', text2: e.message || 'Terjadi kesalahan jaringan', position: 'top', visibilityTime: 4000 });
    } finally {
      setIsLoading(false);
    }
  };

  const renderWelcome = () => (
    <View style={styles.welcomeContainer}>
      <LinearGradient
        colors={[primaryDarkBlue, primaryBlue, isDark ? colors.background : '#ffffff']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <Animated.View entering={FadeInDown.duration(800)} style={styles.welcomeLogoContainer}>
        <View style={styles.logoCircleLarge}>
          <Image source={require('../assets/images/rahverse_logo.png')} style={{ width: 70, height: 70 }} resizeMode="contain" />
        </View>
        <Text style={styles.welcomeAppName}>RAHVerse</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(800).delay(300)} style={styles.welcomeBottomPanel}>
        <Text style={[styles.welcomeDesc, { color: isDark ? '#cbd5e1' : '#475569' }]}>
          {t('artNoDesc') ? 'Eksplorasi Warisan Budaya & Sejarah Raja Ali Haji dengan teknologi AI interaktif.' : 'Your AI Assistant for Cultural Heritage.'}
        </Text>
        
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: primaryBlue }]} onPress={() => handleTabSwitch('login')} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>Sign In</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.outlineBtn, { borderColor: primaryBlue }]} onPress={() => handleTabSwitch('register')} activeOpacity={0.8}>
          <Text style={[styles.outlineBtnText, { color: primaryBlue }]}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 20, paddingVertical: 8 }} onPress={() => router.replace('/(tabs)')} activeOpacity={0.6}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: isDark ? '#94a3b8' : '#64748b', textDecorationLine: 'underline' }}>
            {t('continueAsGuest') || 'Jelajahi sebagai Tamu'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  const renderLogin = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <Animated.View entering={FadeIn.duration(600)} style={{ flex: 1 }}>
        <View style={[styles.topHeaderRow, { marginBottom: 24 }]}>
          <TouchableOpacity onPress={() => handleTabSwitch('welcome')} style={{ padding: 8, marginLeft: -8 }}>
            <Feather name="arrow-left" size={24} color={isDark ? '#ffffff' : '#0f172a'} />
          </TouchableOpacity>
          <View style={[styles.logoCircleSmall, { marginLeft: 'auto', marginRight: 12 }]}>
            <Image source={require('../assets/images/rahverse_logo.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
          </View>
          <Text style={styles.versionText}>1.0.0 Alpha</Text>
        </View>

        <View style={{ marginBottom: 40 }}>
          <Text style={[styles.titleLarge, { color: isDark ? '#ffffff' : '#0f172a', marginLeft: 0, fontSize: 32, marginBottom: 8 }]}>Sign In</Text>
          <Text style={{ fontSize: 16, color: isDark ? '#94a3b8' : '#64748b' }}>Welcome back! Please enter your details.</Text>
        </View>

        <Text style={[styles.inputLabel, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>Email / Username</Text>
        <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1e293b' : '#f3f4f6' }]}>
          <TextInput
            style={[styles.input, { color: isDark ? '#f8fafc' : '#0f172a' }]}
            placeholder="nathan.roberts@example.com"
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={[styles.inputLabel, { color: isDark ? '#e2e8f0' : '#1e293b', marginTop: 16 }]}>Password</Text>
        <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1e293b' : '#f3f4f6' }]}>
          <TextInput
            style={[styles.input, { color: isDark ? '#f8fafc' : '#0f172a' }]}
            placeholder="••••••••"
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
            <Feather name={showPass ? "eye" : "eye-off"} size={18} color={isDark ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
        </View>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <TouchableOpacity 
          style={[styles.primaryBtn, { backgroundColor: primaryBlue, marginTop: 24 }]} 
          onPress={handleLogin} 
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Sign In</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword} disabled={isLoading}>
          <Text style={[styles.forgotText, { color: primaryBlue }]}>Forgot Password?</Text>
        </TouchableOpacity>


        <View style={[styles.footerRow, { marginTop: 'auto', paddingTop: 32 }]}>
          <Text style={[styles.footerText, { color: isDark ? '#cbd5e1' : '#64748b' }]}>Don&apos;t have an account? </Text>
          <TouchableOpacity onPress={() => handleTabSwitch('register')}>
            <Text style={[styles.footerLink, { color: primaryBlue }]}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );

  const renderRegister = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <Animated.View entering={FadeIn.duration(600)} style={{ flex: 1 }}>
        <TouchableOpacity style={styles.backTitleRow} onPress={() => handleTabSwitch('login')}>
          <Feather name="arrow-left" size={24} color={isDark ? '#ffffff' : '#0f172a'} />
          <Text style={[styles.titleLarge, { color: isDark ? '#ffffff' : '#0f172a' }]}>Create Account</Text>
        </TouchableOpacity>

        <Text style={[styles.inputLabel, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>Full Name</Text>
        <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1e293b' : '#f3f4f6' }]}>
          <TextInput
            style={[styles.input, { color: isDark ? '#f8fafc' : '#0f172a' }]}
            placeholder="John Doe"
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <Text style={[styles.inputLabel, { color: isDark ? '#e2e8f0' : '#1e293b', marginTop: 16 }]}>Email</Text>
        <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1e293b' : '#f3f4f6' }]}>
          <TextInput
            style={[styles.input, { color: isDark ? '#f8fafc' : '#0f172a' }]}
            placeholder="john.doe@example.com"
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={[styles.inputLabel, { color: isDark ? '#e2e8f0' : '#1e293b', marginTop: 16 }]}>Password</Text>
        <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1e293b' : '#f3f4f6' }]}>
          <TextInput
            style={[styles.input, { color: isDark ? '#f8fafc' : '#0f172a' }]}
            placeholder="••••••••"
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
            <Feather name={showPass ? "eye" : "eye-off"} size={18} color={isDark ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.inputLabel, { color: isDark ? '#e2e8f0' : '#1e293b', marginTop: 16 }]}>Confirm Password</Text>
        <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1e293b' : '#f3f4f6' }]}>
          <TextInput
            style={[styles.input, { color: isDark ? '#f8fafc' : '#0f172a' }]}
            placeholder="••••••••"
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            secureTextEntry={!showPass}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <TouchableOpacity style={styles.checkboxRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.8}>
          <View style={[styles.checkbox, agreed && { backgroundColor: primaryBlue, borderColor: primaryBlue }]}>
            {agreed && <Feather name="check" size={12} color="#ffffff" />}
          </View>
          <Text style={[styles.checkboxText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            I agree to the <Text style={{ color: primaryBlue, fontWeight: '600' }}>Terms & Conditions</Text> and <Text style={{ color: primaryBlue, fontWeight: '600' }}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.primaryBtn, { backgroundColor: primaryBlue, marginTop: 16 }]} 
          onPress={handleRegister} 
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Create Account</Text>}
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );

  if (isInitializingTab) {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? colors.background : '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
        <LottieView
          source={require('../assets/animations/Free Searching Animation.json')}
          autoPlay
          loop
          style={{ width: 180, height: 180 }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: isDark ? colors.background : '#ffffff' }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {activeTab === 'welcome' && renderWelcome()}
        {activeTab === 'login' && renderLogin()}
        {activeTab === 'register' && renderRegister()}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60, flexGrow: 1, justifyContent: 'center' },
  
  // Welcome Styles
  welcomeContainer: { flex: 1, justifyContent: 'space-between' },
  welcomeLogoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoCircleLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  welcomeAppName: { fontSize: 36, fontWeight: '800', color: '#ffffff', letterSpacing: 1 },
  welcomeBottomPanel: { padding: 32, paddingBottom: Platform.OS === 'ios' ? 40 : 32, alignItems: 'center' },
  welcomeDesc: { fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24, fontWeight: '500' },
  
  // Shared Buttons
  primaryBtn: { width: '100%', height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  outlineBtn: { width: '100%', height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  outlineBtnText: { fontSize: 16, fontWeight: '700' },
  
  // Login/Register Styles
  topHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, marginTop: 10 },
  logoCircleSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  versionText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  
  backTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, marginTop: 10 },
  titleLarge: { fontSize: 24, fontWeight: '700', marginLeft: 16 },
  
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 16, paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 15, height: '100%' },
  eyeBtn: { padding: 8 },
  
  errorText: { color: '#ef4444', fontSize: 13, marginTop: 8, marginLeft: 4 },
  
  forgotBtn: { alignSelf: 'center', marginTop: 20, padding: 8 },
  forgotText: { fontSize: 14, fontWeight: '600' },

  
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
  
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 16, paddingRight: 20 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#94a3b8', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checkboxText: { fontSize: 13, lineHeight: 20, flex: 1 },
});
