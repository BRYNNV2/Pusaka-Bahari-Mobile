const fs = require('fs');
let code = fs.readFileSync('app/profile.tsx', 'utf8');

// The current code has absoluteHeader and ScrollView:
/*
      <SafeAreaView edges={['top']} style={styles.absoluteHeader}>
        <LinearGradient ... />
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitleBar}>Profil Akun</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20, paddingTop: 100 }} bounces={false} style={{ flex: 1 }}>
          {/* Curved Header Background with Faded Image (MOVED BACK INSIDE) *\/}
          <View style={styles.headerBackground}>
*/

const searchRegex = /<SafeAreaView edges=\{\['top'\]\} style=\{styles\.absoluteHeader\}>[\s\S]*?<ScrollView showsVerticalScrollIndicator=\{false\} contentContainerStyle=\{\{ paddingBottom: 20, paddingTop: 100 \}\} bounces=\{false\} style=\{\{ flex: 1 \}\}>/;

const replaceContent = `<SafeAreaView edges={['top']} style={styles.floatingBackBtnArea} pointerEvents="box-none">
        <TouchableOpacity onPress={() => router.back()} style={styles.floatingBackBtn} activeOpacity={0.8}>
          <View style={styles.floatingBackBtnCircle}>
            <Feather name="arrow-left" size={22} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} bounces={false} style={{ flex: 1 }}>`;

code = code.replace(searchRegex, replaceContent);

// Now we need to put the headerBar back inside ScrollView, right above scrollContent
const contentSearch = `<View style={styles.scrollContent}>`;
const contentReplace = `<SafeAreaView edges={['top']} style={{ flex: 1, position: 'absolute', top: 0, width: '100%', zIndex: 10 }} pointerEvents="none">
            <View style={[styles.headerBar, { justifyContent: 'center' }]}>
              <Text style={styles.headerTitleBar}>Profil Akun</Text>
            </View>
          </SafeAreaView>

          <View style={styles.scrollContent}>`;
code = code.replace(contentSearch, contentReplace);

// Add the styles
const stylesSearch = `  absoluteHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999, backgroundColor: isDark ? colors.backgroundSecondary : '#0f172a' },`;
const stylesReplace = `  floatingBackBtnArea: { position: 'absolute', top: 0, left: 0, zIndex: 999 },
  floatingBackBtn: { padding: 20, paddingTop: 12 },
  floatingBackBtnCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },`;
code = code.replace(stylesSearch, stylesReplace);

fs.writeFileSync('app/profile.tsx', code);
console.log('Floating back button added!');
