import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

type AuthContextType = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isAdmin: false,
  user: null,
  session: null,
  loading: true,
  login: async () => ({ error: null }),
  register: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const checkAdminStatus = async (userId: string): Promise<boolean> => {
  const fetchPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();
      if (error) return { status: 'error', value: false };
      return { status: 'success', value: data?.is_admin ?? false };
    } catch {
      return { status: 'error', value: false };
    }
  })();

  const timeoutPromise = new Promise<{ status: string; value: boolean }>((resolve) =>
    setTimeout(() => resolve({ status: 'timeout', value: false }), 3500)
  );

  try {
    const result = await Promise.race([fetchPromise, timeoutPromise]);
    if (result.status === 'success') {
      await AsyncStorage.setItem(`@is_admin_${userId}`, String(result.value));
      return result.value;
    } else {
      const cached = await AsyncStorage.getItem(`@is_admin_${userId}`);
      return cached === 'true';
    }
  } catch (e) {
    const cached = await AsyncStorage.getItem(`@is_admin_${userId}`);
    return cached === 'true';
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleDeepLink = async (url: string | null) => {
    if (!url) return;
    console.log('Incoming Deep Link URL:', url);
    
    if (url.includes('#') && url.includes('access_token=')) {
      const hash = url.split('#')[1];
      if (hash) {
        const params: { [key: string]: string } = {};
        hash.split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key && value) {
            params[key] = decodeURIComponent(value);
          }
        });

        if (params.access_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token || '',
          });
          
          if (!error && data.session) {
            console.log('Supabase session successfully restored via deep link!');
            setTimeout(() => {
              router.replace('/reset-password');
            }, 500);
          } else {
            console.error('Failed to set session via deep link:', error?.message);
          }
        }
      }
    }
  };

  useEffect(() => {
    const initSession = async () => {
      const fetchPromise = supabase.auth.getSession().then(async ({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const admin = await checkAdminStatus(session.user.id);
          setIsAdmin(admin);
        }
        return true;
      });

      const timeoutPromise = new Promise<boolean>((resolve) =>
        setTimeout(() => resolve(false), 2500)
      );

      try {
        await Promise.race([fetchPromise, timeoutPromise]);
      } catch (e) {
        console.warn('Initial session fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Run database queries on a separate event loop tick to prevent locking/deadlocks in the SDK
        setTimeout(() => {
          checkAdminStatus(session.user.id).then((admin) => {
            setIsAdmin(admin);
          }).catch((err) => {
            console.warn('Failed to check admin status:', err);
          });
        }, 0);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Listen for deep links when app is running
    const linkSubscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Check if the app was opened by a deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => {
      subscription.unsubscribe();
      linkSubscription.remove();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const register = async (email: string, password: string, fullName: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'mobileproject://reset-password',
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Terjadi kesalahan jaringan' };
    }
  };

  const logout = async () => {
    setIsAdmin(false);
    try {
      await AsyncStorage.removeItem('agenda_popup_date');
    } catch (e) {}
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!session,
        isAdmin,
        user,
        session,
        loading,
        login,
        register,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
