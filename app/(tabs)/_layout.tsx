import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet, TouchableOpacity, Text, Animated, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function CustomTabBar({ state, descriptors, navigation, colors, isDark, t }: any) {
  // We have 5 routes. We'll create an array of Animated.Values.
  const animatedValues = useRef(
    state.routes.map((_: any, index: number) => new Animated.Value(index === state.index ? 1 : 0))
  ).current;

  useEffect(() => {
    state.routes.forEach((_: any, index: number) => {
      Animated.spring(animatedValues[index], {
        toValue: index === state.index ? 1 : 0,
        useNativeDriver: true, // Native driver is now fully enabled for 60fps animations!
        damping: 15,
        stiffness: 150,
      }).start();
    });
  }, [state.index]);

  return (
    <View style={[styles.tabBarContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate({ name: route.name, merge: true });
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Icon configuration
        let iconName: any = 'home-outline';
        if (route.name === 'index') {
          iconName = isFocused ? 'home' : 'home-outline';
        } else if (route.name === 'map') {
          iconName = isFocused ? 'map' : 'map-outline';
        } else if (route.name === 'gallery') {
          iconName = isFocused ? 'images' : 'images-outline';
        } else if (route.name === 'catalog') {
          iconName = isFocused ? 'apps' : 'apps-outline';
        } else if (route.name === 'books') {
          iconName = isFocused ? 'library' : 'library-outline';
        }

        const animatedValue = animatedValues[index];

        const translateY = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -18],
        });

        const scale = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.15],
        });

        // Label style animations
        const labelOpacity = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });

        const labelTranslateY = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        });

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
            activeOpacity={0.85}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ translateY }, { scale }],
                },
              ]}
            >
              {/* Active Background Circle - animates scale and opacity on native driver */}
              <Animated.View
                style={[
                  styles.activeCircle,
                  {
                    backgroundColor: isDark ? colors.primary : colors.text,
                    opacity: animatedValue,
                    transform: [{ scale: animatedValue }],
                  },
                ]}
              />

              {/* Overlaying icons for extremely smooth fade transition */}
              <Animated.View style={{ opacity: animatedValue.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), position: 'absolute' }}>
                <Ionicons name={(iconName.replace('-outline', '') + '-outline') as any} size={20} color={colors.textSecondary} />
              </Animated.View>
              <Animated.View style={{ opacity: animatedValue, position: 'absolute' }}>
                <Ionicons name={iconName.split('-outline')[0] as any} size={20} color={isDark ? '#0f172a' : colors.background} />
              </Animated.View>
            </Animated.View>

            <Animated.View
              style={{
                opacity: labelOpacity,
                transform: [{ translateY: labelTranslateY }],
                position: 'absolute',
                bottom: 8,
              }}
            >
              <Text style={[styles.tabLabel, { color: isDark ? colors.primary : colors.text }]}>
                {label}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const CustomTabs = Tabs as any;

  return (
    <CustomTabs
      sceneContainerStyle={{ backgroundColor: colors.background }}
      tabBar={(props: any) => (
        <CustomTabBar
          {...props}
          colors={colors}
          isDark={isDark}
          t={t}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: t('tabHome'),
        }} 
      />
      <Tabs.Screen 
        name="map" 
        options={{ 
          title: t('tabMap'),
        }} 
      />
      <Tabs.Screen 
        name="gallery" 
        options={{ 
          title: t('tabGallery'),
        }} 
      />
      <Tabs.Screen 
        name="catalog" 
        options={{ 
          title: t('tabCatalog'),
        }} 
      />
      <Tabs.Screen 
        name="books" 
        options={{ 
          title: t('tabBooks'),
        }} 
      />
    </CustomTabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 12,
    left: 16,
    right: 16,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    zIndex: 99,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeCircle: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
