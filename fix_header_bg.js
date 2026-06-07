const fs = require('fs');
let code = fs.readFileSync('app/profile.tsx', 'utf8');

const searchStr = `{/* Curved Header Background with Faded Image (MOVED OUTSIDE) */}
      <View style={styles.headerBackground}>
        <Image 
          source={require('../assets/images/masjid_penyengat_1776493242751.jpg')}
          style={{ 
            width: width, 
            height: height * 0.23, 
            position: 'absolute', 
            bottom: 0, 
            left: (width * 2.5 - width) / 2, 
            opacity: 0.25 
          }}
          resizeMode="cover"
        />
      </View>

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitleBar}>Profil Akun</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} bounces={false}>
          <View style={styles.scrollContent}>`;

const replaceStr = `      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitleBar}>Profil Akun</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} bounces={false}>
          {/* Curved Header Background with Faded Image (MOVED BACK INSIDE) */}
          <View style={styles.headerBackground}>
            <Image 
              source={require('../assets/images/masjid_penyengat_1776493242751.jpg')}
              style={{ 
                width: width, 
                height: height * 0.23, 
                position: 'absolute', 
                bottom: 0, 
                left: (width * 2.5 - width) / 2, 
                opacity: 0.25 
              }}
              resizeMode="cover"
            />
          </View>

          <View style={styles.scrollContent}>`;

if (code.includes(searchStr)) {
    code = code.replace(searchStr, replaceStr);
    
    // Also change headerBackground top value so it correctly aligns inside the ScrollView
    // Since SafeAreaView top inset is now outside, the ScrollView top starts exactly below headerBar.
    // Let's adjust top: -(width * 2.5 - (height * 0.22))
    // We might need to adjust it later if it looks off, but let's just see.
    fs.writeFileSync('app/profile.tsx', code);
    console.log('headerBackground moved back into ScrollView!');
} else {
    console.log('Search string not found!');
}
