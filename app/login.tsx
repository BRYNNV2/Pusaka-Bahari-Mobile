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
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type Tab = 'login' | 'register';

export default function LoginScreen() {
  const { mode, isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { login, register } = useAuth();
  const { t } = useLanguage();

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
      setErrorMsg(t('loginErrEmailPass'));
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
      setErrorMsg(t('loginErrAllField'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t('loginErrMatch'));
      return;
    }
    if (password.length < 6) {
      setErrorMsg(t('loginErrLength'));
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
        t('loginRegSuccessTitle'),
        t('loginRegSuccessDesc'),
        [{ text: 'OK', onPress: () => handleTabSwitch('login') }]
      );
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg(t('loginResetReq'));
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    
    // Gunakan expo-linking untuk membuat link yang akan membuka kembali aplikasi ini.
    // Di Expo Go akan menjadi exp://..., di APK akan menjadi mobileproject://reset-password
    const redirectUrl = Linking.createURL('reset-password');
    
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });
    
    setIsLoading(false);
    if (error) {
      setErrorMsg(translateError(error.message));
    } else {
      Alert.alert(
        t('loginResetSentTitle'),
        t('loginResetSentDesc'),
        [{ text: 'OK' }]
      );
    }
  };

  const handleGuest = () => {
    router.replace('/(tabs)');
  };

  const translateError = (error: string): string => {
    if (error.includes('Invalid login credentials')) return t('loginErrInvalidCred');
    if (error.includes('Email not confirmed')) return t('loginErrNotConf');
    if (error.includes('User already registered')) return t('loginErrAlreadyReg');
    if (error.includes('Password should be')) return t('loginErrWeakPass');
    if (error.includes('Unable to validate email')) return t('loginErrInvalidEmail');
    if (error.includes('User not found')) return t('loginErrNotFound');
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
              source={require('../assets/images/Halamanlogin.webp')}
              style={styles.coverImage}
            />
            <View style={styles.imageOverlay} />
          </Animated.View>

          <View style={styles.formArea}>

            {/* Tab Switcher */}
            <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'login' && styles.tabActive]}
                onPress={() => handleTabSwitch('login')}
              >
                <Text style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}>{t('loginTabIn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'register' && styles.tabActive]}
                onPress={() => handleTabSwitch('register')}
              >
                <Text style={[styles.tabText, activeTab === 'register' && styles.tabTextActive]}>{t('loginTabUp')}</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Title */}
            <Animated.View entering={FadeInDown.duration(500).delay(150)}>
              <Text style={styles.title}>
                {activeTab === 'login' ? t('loginWelcome2') : t('loginJoin2')}
              </Text>
              <Text style={styles.subtitle}>
                {activeTab === 'login'
                  ? t('loginWelcomeSub2') : t('loginJoinSub2')}
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
                  <Feather name="user" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('loginFullName2')}
                    placeholderTextColor={colors.textSecondary}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Feather name="mail" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('loginEmail2')}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputContainer}>
                <Feather name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('loginPass2')}
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Feather name={showPass ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {activeTab === 'register' && (
                <View style={styles.inputContainer}>
                  <Feather name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('loginConfirmPass2')}
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showPass}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              )}

              {activeTab === 'login' && (
                <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
                  <Text style={styles.forgotText}>{t('loginForgot')}</Text>
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
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {activeTab === 'login' ? t('loginSubmitIn') : t('loginSubmitUp')}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Guest Mode Divider */}
            <Animated.View entering={FadeIn.duration(800).delay(400)}>
              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>{t('loginOr')}</Text>
                <View style={styles.line} />
              </View>
              <TouchableOpacity style={styles.guestBtn} onPress={handleGuest}>
                <Text style={styles.guestBtnText}>{t('loginGuest')}</Text>
                <Feather name="arrow-right" size={16} color="#475569" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </Animated.View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.card,
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)', // Dipergelap sedikit agar elemen UI lebih menonjol
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
    backgroundColor: colors.border,
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
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.text,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? "rgba(220, 38, 38, 0.1)" : "#fef2f2",
    borderWidth: 1,
    borderColor: isDark ? "rgba(220, 38, 38, 0.3)" : "#fecaca",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.danger,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.text,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  forgotText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  primaryBtn: {
    backgroundColor: colors.text,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnDisabled: {
    backgroundColor: colors.textSecondary,
    elevation: 0,
  },
  primaryBtnText: {
    color: colors.card,
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
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textSecondary,
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  guestBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBtnText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
