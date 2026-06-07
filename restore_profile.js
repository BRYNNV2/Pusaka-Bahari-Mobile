const fs = require('fs');
let code = fs.readFileSync('app/profile.tsx', 'utf8');

// The current code has the messed up layout. Let's fix it by replacing the entire top section of the return statement.
const searchStart = `<View style={styles.container}>`;
const searchEnd = `<View style={styles.avatarSection}>`;

const regex = new RegExp(`${searchStart}[\\s\\S]*?${searchEnd}`);

const replacement = `<View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* FLOATING BACK BUTTON (OUTSIDE SCROLLVIEW) */}
      <SafeAreaView edges={['top']} style={styles.floatingBackBtnArea} pointerEvents="box-none">
        <TouchableOpacity onPress={() => router.back()} style={styles.floatingBackBtn} activeOpacity={0.8}>
          <View style={styles.floatingBackBtnCircle}>
            <Feather name="arrow-left" size={22} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} bounces={false} style={{ flex: 1 }}>
        {/* Curved Header Background with Faded Image */}
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

        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.headerBar}>
            <View style={{ width: 40 }} /> {/* Placeholder for back button */}
            <Text style={styles.headerTitleBar}>Profil Akun</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.scrollContent}>
          
          {/* Avatar & Profile Info Section */}
          <View style={styles.avatarSection}>`;

code = code.replace(regex, replacement);

fs.writeFileSync('app/profile.tsx', code);
console.log('Profile reverted to working layout with floating back button!');
