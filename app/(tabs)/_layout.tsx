import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Platform, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const TAB_BAR_WIDTH = width - 40;
  const TAB_WIDTH = TAB_BAR_WIDTH / state.routes.length;

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: withTiming(state.index * TAB_WIDTH, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }) }],
    };
  });

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <BlurView intensity={60} tint="light" style={styles.tabBar}>
        {/* Animated Background Indicator */}
        <Animated.View style={[styles.indicator, { width: TAB_WIDTH }, animatedIndicatorStyle]}>
          <View style={styles.indicatorCircle} />
        </Animated.View>

        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.title !== undefined ? options.title : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const iconName = 
            route.name === 'index' ? 'home' :
            route.name === 'map' ? 'map' :
            route.name === 'gallery' ? 'image' : 'book-open';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.8}
            >
              <Feather 
                name={iconName} 
                size={22} 
                color={isFocused ? '#ffffff' : '#94a3b8'} 
                style={{ zIndex: 1, marginBottom: 4 }} 
              />
              <Text style={{ fontSize: 11, fontWeight: isFocused ? '700' : '600', color: isFocused ? '#0f172a' : '#94a3b8', zIndex: 1, marginTop: isFocused ? 28 : 0, position: isFocused ? 'absolute' : 'relative', bottom: isFocused ? -20 : 0 }}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Beranda' }} />
      <Tabs.Screen name="map" options={{ title: 'Peta' }} />
      <Tabs.Screen name="gallery" options={{ title: 'Galeri' }} />
      <Tabs.Screen name="catalog" options={{ title: 'Katalog' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    width: width - 40,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.65)', // Semi-transparent for glass effect
    borderRadius: 35,
    overflow: 'hidden', // Needed for BlurView corner rounding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
    paddingHorizontal: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  indicator: {
    position: 'absolute',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  indicatorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0088CC',
    top: -4,
  },
});
