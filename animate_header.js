const fs = require('fs');
let code = fs.readFileSync('app/profile.tsx', 'utf8');

// 1. Update react-native-reanimated imports
const importSearch = `import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';`;
const importReplace = `import Animated, { 
  FadeIn, 
  SlideInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedScrollHandler, 
  interpolate, 
  Extrapolate 
} from 'react-native-reanimated';`;

code = code.replace(importSearch, importReplace);

// 2. Remove the old scrolled state and handleScroll function
const scrolledStateSearch = `  const [scrolled, setScrolled]   = useState(false);`;
code = code.replace(scrolledStateSearch, '');

const handleScrollSearch = `  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 10) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  };`;
code = code.replace(handleScrollSearch, '');

// 3. Add reanimated shared values and styles
const profileInitSearch = `  const [profile, setProfile]     = useState<Profile | null>(null);`;
const profileInitReplace = `  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 80],
      [0, 1],
      Extrapolate.CLAMP
    );
    return {
      opacity: opacity,
    };
  });

  const [profile, setProfile]     = useState<Profile | null>(null);`;

code = code.replace(profileInitSearch, profileInitReplace);

// 4. Update the sticky header rendering with an Animated.View background
const headerSearch = `      {/* STICKY HEADER WITH DYNAMIC BACKGROUND */}
      <SafeAreaView 
        edges={['top']} 
        style={[
          styles.absoluteHeader,
          { 
            backgroundColor: scrolled 
              ? (isDark ? colors.backgroundSecondary : '#0f172a') 
              : 'transparent'
          }
        ]}
      >
        <View style={styles.headerBar}>`;

const headerReplace = `      {/* STICKY HEADER WITH DYNAMIC BACKGROUND */}
      <SafeAreaView edges={['top']} style={styles.absoluteHeader}>
        <Animated.View 
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? colors.backgroundSecondary : '#0f172a' },
            headerAnimatedStyle
          ]}
        />
        <View style={styles.headerBar}>`;

code = code.replace(headerSearch, headerReplace);

// 5. Change ScrollView to Animated.ScrollView and attach scrollHandler
const scrollViewSearch = `      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 20 }} 
        bounces={false} 
        style={{ flex: 1 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >`;

const scrollViewReplace = `      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 20 }} 
        bounces={false} 
        style={{ flex: 1 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >`;

code = code.replace(scrollViewSearch, scrollViewReplace);

fs.writeFileSync('app/profile.tsx', code);
console.log('Smooth animated header successfully implemented!');
