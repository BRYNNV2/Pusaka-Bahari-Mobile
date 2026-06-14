import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Animated, StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type ToastType = 'success' | 'error';

interface ToastData {
  type?: ToastType;
  text1?: string;
  text2?: string;
  visibilityTime?: number;
  position?: string;
  [key: string]: any;
}

export interface CustomToastRef {
  show: (data: ToastData) => void;
}

// Stack-based reference so the topmost instance (inside a Modal) takes priority
const toastRefStack: CustomToastRef[] = [];

export const CustomToastManager = {
  show: (data: ToastData) => {
    // Use the last (topmost) registered instance
    const activeRef = toastRefStack[toastRefStack.length - 1];
    activeRef?.show(data);
  },
  _register: (ref: CustomToastRef) => {
    toastRefStack.push(ref);
  },
  _unregister: (ref: CustomToastRef) => {
    const idx = toastRefStack.indexOf(ref);
    if (idx !== -1) toastRefStack.splice(idx, 1);
  },
};

const CustomToast = forwardRef<CustomToastRef>((_, ref) => {
  const [visible, setVisible] = useState(false);
  const [toastData, setToastData] = useState<ToastData>({});
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  }, [translateY, opacity]);

  const show = useCallback((data: ToastData) => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToastData(data);
    setVisible(true);

    // Reset position
    translateY.setValue(-120);
    opacity.setValue(0);

    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    const duration = data.visibilityTime || 3000;
    timerRef.current = setTimeout(() => {
      hide();
    }, duration);
  }, [translateY, opacity, hide]);

  useImperativeHandle(ref, () => ({ show }));

  // Register this instance in the global stack
  useEffect(() => {
    const ref = { show };
    CustomToastManager._register(ref);
    return () => {
      CustomToastManager._unregister(ref);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [show]);

  if (!visible) return null;

  const isError = toastData.type === 'error';
  
  // Custom theme colors matching the mockup
  const toastBg = isError ? '#eaeaea' : '#add7f6';
  const toastBorder = isError ? '#d0d0d0' : '#8abfe5';
  const dividerBg = isError ? '#b0b0b0' : '#599ec7';
  const closeBtnBg = isError ? '#b8b8b8' : '#7aa6c2';
  const closeBtnBorder = isError ? '#d0d0d0' : '#8abfe5';
  const titleColor = isError ? '#505050' : '#ffffff';
  const descColor = isError ? '#404040' : '#1e3a8a';

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: toastBg,
            borderColor: toastBorder,
            transform: [{ translateY }],
            opacity,
          },
        ]}
        pointerEvents="auto"
      >
        {/* Left Illustration/Icon */}
        <View style={styles.iconWrapper}>
          {isError ? (
            <Ionicons name="mail-unread-outline" size={32} color="#505050" />
          ) : (
            <Ionicons name="mail-open-outline" size={32} color="#2563eb" />
          )}
        </View>

        {/* Vertical Divider */}
        <View style={[styles.divider, { backgroundColor: dividerBg }]} />

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={[styles.text1, { color: titleColor }]} numberOfLines={1}>
            {toastData.text1 || (isError ? 'ERROR!' : 'SUCCESS!')}
          </Text>
          <Text style={[styles.text2, { color: descColor }]} numberOfLines={2}>
            {toastData.text2 || ''}
          </Text>
        </View>

        {/* Right Circular Close Button Overlay */}
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: closeBtnBg, borderColor: closeBtnBorder }]}
          onPress={hide}
          activeOpacity={0.8}
        >
          <Feather name="x" size={14} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

CustomToast.displayName = 'CustomToast';

export default CustomToast;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 24, // extra padding so close button doesn't clip off screen edge
  },
  toast: {
    width: width - 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'visible', // allow close button to overlay on right border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1.5,
    height: 38,
    marginHorizontal: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8, // padding before the close button area
  },
  text1: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  text2: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 18,
  },
  closeButton: {
    position: 'absolute',
    right: -12, // overlaying the right border
    top: '50%',
    transform: [{ translateY: -14 }], // center vertically
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
});
