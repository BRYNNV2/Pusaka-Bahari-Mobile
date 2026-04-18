import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    login();
    router.replace('/');
  };

  const handleGuest = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView bounces={false} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Animated.View entering={FadeIn.duration(800)} style={styles.imageWrap}>
            <Image 
              source={require('../assets/images/masjid_penyengat_1776493242751.png')} 
              style={styles.coverImage}
            />
          </Animated.View>

          <View style={styles.formArea}>
            <Animated.View entering={FadeInDown.duration(600).delay(200)}>
              <View style={styles.logoBadge}>
                <Feather name="anchor" size={24} color="#0f172a" />
              </View>
              <Text style={styles.title}>Gabung ke{'\n'}Pusaka Bahari</Text>
              <Text style={styles.subtitle}>Buka akses untuk menyimpan catatan sejarah dan koleksi naskah.</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.inputGroup}>
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
                   secureTextEntry
                   value={password}
                   onChangeText={setPassword}
                 />
              </View>

              <TouchableOpacity style={styles.forgotBtn}>
                 <Text style={styles.forgotText}>Lupa kata sandi?</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(600).delay(400)}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} activeOpacity={0.8}>
                 <Text style={styles.primaryBtnText}>Masuk Akun</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeIn.duration(800).delay(600)}>
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

import { ScrollView } from 'react-native';

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
    height: 280,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  formArea: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 40,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 38,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#0f172a',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 14,
  },
  primaryBtn: {
    backgroundColor: '#0f172a',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    color: '#94a3b8',
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '600',
  },
  guestBtn: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBtnText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  }
});
