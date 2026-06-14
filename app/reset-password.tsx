import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { colors, isDark } = useTheme();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', t('resetErrEmpty'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', t('resetErrMatch'));
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', t('resetErrLength'));
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      if (error) {
        Alert.alert(t('resetFailTitle'), error.message);
      } else {
        Alert.alert(
          t('resetSuccessTitle'),
          t('resetSuccessDesc'),
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={[styles.logoCircle, { backgroundColor: colors.card }]}>
              <Ionicons name="key-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{t('resetTitle')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('resetSub')}</Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.text }]}>{t('resetNewPass')}</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Feather name={showPass ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>{t('resetConfirmPass')}</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPass}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity 
              style={[
                styles.primaryBtn, 
                { backgroundColor: colors.primary },
                isLoading && { opacity: 0.7 }
              ]} 
              onPress={handleUpdatePassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryBtnText}>{t('resetSaveBtn')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backBtn}
              onPress={() => router.replace('/login')}
              disabled={isLoading}
            >
              <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>
                {language === 'en' ? 'Back to Login' : 'Kembali ke Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: {
    alignSelf: 'center',
    marginTop: 20,
    padding: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
