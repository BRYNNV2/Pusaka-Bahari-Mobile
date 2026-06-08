import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi untuk memperbarui kata sandi
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
    // Karena pengguna dialihkan dari email (deep link), mereka sebenarnya sudah "login" secara otomatis oleh Supabase
    // Sehingga kita bisa langsung memanggil updateUser()
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    setIsLoading(false);

    if (error) {
      Alert.alert(t('resetFailTitle'), error.message);
    } else {
      Alert.alert(
        t('resetSuccessTitle'),
        t('resetSuccessDesc'),
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('resetTitle')}</Text>
          <Text style={styles.subtitle}>{t('resetSub')}</Text>
        </View>

        <View style={styles.inputContainer}>
          <Feather name="lock" size={20} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('resetNewPass')}
            placeholderTextColor="#94a3b8"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Feather name={showPass ? 'eye-off' : 'eye'} size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Feather name="lock" size={20} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('resetConfirmPass')}
            placeholderTextColor="#94a3b8"
            secureTextEntry={!showPass}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <TouchableOpacity 
          style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]} 
          onPress={handleUpdatePassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.primaryBtnText}>{t('resetSaveBtn')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
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
    marginBottom: 16,
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
  primaryBtn: {
    backgroundColor: '#0f172a',
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryBtnDisabled: {
    backgroundColor: '#475569',
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
