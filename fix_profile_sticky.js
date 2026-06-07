const fs = require('fs');
let code = fs.readFileSync('app/profile.tsx', 'utf8');

// The original block looks like:
/*
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} bounces={false}>
        {/* Curved Header Background with Faded Image *\/}
        <View style={styles.headerBackground}>
          <Image ... />
        </View>

        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.headerBar}> ... </View>

          <View style={styles.scrollContent}>
*/

const searchStr = `<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} bounces={false}>
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
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <Feather name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitleBar}>Profil Akun</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.scrollContent}>`;

const replaceStr = `{/* Curved Header Background with Faded Image (MOVED OUTSIDE) */}
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

if (code.includes(searchStr)) {
    code = code.replace(searchStr, replaceStr);
    
    // We also need to close the ScrollView properly.
    // The original code had:
    /*
              </View>
            </View>
          </SafeAreaView>
        </ScrollView>
    */
    // We need to change the closing tags
    const closingSearch = `          </View>
        </SafeAreaView>
      </ScrollView>`;
      
    const closingReplace = `          </View>
        </ScrollView>
      </SafeAreaView>`;
      
    code = code.replace(closingSearch, closingReplace);

    fs.writeFileSync('app/profile.tsx', code);
    console.log('Profile sticky header applied!');
} else {
    console.log('Search string not found! Did the file change?');
}
