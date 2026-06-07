const fs = require('fs');
let code = fs.readFileSync('app/profile.tsx', 'utf8');

// 1. Add scrolled state inside ProfileScreen
const stateSearch = `const [profile, setProfile]     = useState<Profile | null>(null);`;
const stateReplace = `const [scrolled, setScrolled]   = useState(false);
  const [profile, setProfile]     = useState<Profile | null>(null);`;

code = code.replace(stateSearch, stateReplace);

// 2. Add handleScroll function
const funcSearch = `const fetchProfile = async () => {`;
const funcReplace = `const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 10) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  };

  const fetchProfile = async () => {`;

code = code.replace(funcSearch, funcReplace);

// 3. Replace the return JSX block
const jsxSearch = /return \(\s*<View style=\{styles\.container\}>[\s\S]*?<View style=\{styles\.avatarSection\}>/;
const jsxReplace = `return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* STICKY HEADER WITH DYNAMIC BACKGROUND */}
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
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitleBar}>Profil Akun</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 20 }} 
        bounces={false} 
        style={{ flex: 1 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
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

        {/* Spacer to push content below the transparent header */}
        <SafeAreaView edges={['top']}>
          <View style={{ height: 60 }} />
        </SafeAreaView>

        <View style={styles.scrollContent}>
          
          {/* Avatar & Profile Info Section */}
          <View style={styles.avatarSection}>`;

code = code.replace(jsxSearch, jsxReplace);

// 4. Update the styles to restore absoluteHeader and remove floatingBackBtn styles
const stylesSearch = `  floatingBackBtnArea: { position: 'absolute', top: StatusBar.currentHeight || 20, left: 0, zIndex: 999 },
  floatingBackBtn: { padding: 20, paddingTop: 12 },
  floatingBackBtnCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },`;

const stylesReplace = `  absoluteHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },`;

code = code.replace(stylesSearch, stylesReplace);

// Let's also restore the closing tags at the bottom!
// In the restore_profile.js I had added </SafeAreaView></ScrollView>.
// In the new JSX block, we close </ScrollView></View>.
// Wait! Let's check the bottom of the ScrollView block.
// The code currently has:
/*
          </View>
        </SafeAreaView>
      </ScrollView>
*/
// But our new return JSX block starts the ScrollView, then inside it we have scrollContent, then we close scrollContent, and we close ScrollView. We do NOT wrap scrollContent in SafeAreaView anymore!
// Wait! Yes we do, look at the end of scrollContent in the file:
/*
          </View>
        </SafeAreaView>
      </ScrollView>
*/
// Oh! In my restore_profile.js, I added back `</SafeAreaView>`!
// Let's see if we need to remove it.
// The new JSX block:
// ScrollView -> headerBackground -> Spacer(SafeAreaView) -> scrollContent -> ... -> end of scrollContent (</View>) -> </ScrollView> -> </View> (container)
// So we have an extra `</SafeAreaView>` at the end if we don't remove it!
// Let's replace:
/*
          </View>
        </SafeAreaView>
      </ScrollView>
*/
// with:
/*
          </View>
        </ScrollView>
*/

const closingSearch = `          </View>
        </SafeAreaView>
      </ScrollView>`;

const closingReplace = `          </View>
        </ScrollView>`;

code = code.replace(closingSearch, closingReplace);

fs.writeFileSync('app/profile.tsx', code);
console.log('Premium Dynamic Collapsible Header applied!');
