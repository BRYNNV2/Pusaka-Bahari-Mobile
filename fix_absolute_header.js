const fs = require('fs');
let code = fs.readFileSync('app/profile.tsx', 'utf8');

const searchStr = `      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitleBar}>Profil Akun</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} bounces={false}>`;

const replaceStr = `      <SafeAreaView edges={['top']} style={styles.absoluteHeader}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitleBar}>Profil Akun</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20, paddingTop: 100 }} bounces={false} style={{ flex: 1 }}>`;

code = code.replace(searchStr, replaceStr);

// Wait! We also need to add styles.absoluteHeader
const stylesSearch = `  safeArea: { flex: 1 },`;
const stylesReplace = `  safeArea: { flex: 1 },
  absoluteHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999 },`;

code = code.replace(stylesSearch, stylesReplace);

fs.writeFileSync('app/profile.tsx', code);
console.log('Fixed absolute header!');
