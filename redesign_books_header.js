const fs = require('fs');
let code = fs.readFileSync('app/(tabs)/books.tsx', 'utf8');

// Add TextInput import if not exists
if (!code.match(/import \{[^}]*TextInput[^}]*\} from 'react-native'/)) {
  code = code.replace(/import \{/, "import { TextInput, ");
}

// Ensure state for search
if (!code.includes('const [searchQuery, setSearchQuery]')) {
  code = code.replace(/const \[refreshing, setRefreshing\] = useState\(false\);/, 
    "const [refreshing, setRefreshing] = useState(false);\n  const [searchQuery, setSearchQuery] = useState('');"
  );
}

// Modify the return statement to replace the old header and hero section
const newHeaderJSX = `
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />

      <SafeAreaView edges={['top']} style={{ flex: 0, backgroundColor: colors.card }} />

      {/* New Rich Hero Section */}
      <View style={styles.heroSection}>
        <Image 
          source={require('../../assets/images/naskah_gurindam_1776493215711.jpg')}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient 
          colors={isDark ? ['rgba(15, 23, 42, 0.85)', 'rgba(15, 23, 42, 0.95)'] : ['rgba(139, 94, 60, 0.85)', 'rgba(60, 36, 21, 0.95)']} 
          style={StyleSheet.absoluteFillObject} 
        />
        
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Pustaka Nusantara</Text>
          <Text style={styles.heroSub}>
            Eksplorasi arsip naskah kuno dan literatur warisan sejarah maritim Kepulauan Riau.
          </Text>

          {/* Stats Row */}
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatNum}>{totalBooks}</Text>
              <Text style={styles.heroStatLabel}>Koleksi</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatNum}>{books.filter(b => b.file_url).length}</Text>
              <Text style={styles.heroStatLabel}>Tersedia</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Floating Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari judul buku atau naskah..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
`;

code = code.replace(/<View style=\{styles\.container\}>[\s\S]*?<\/View>\s*<\/View>/, newHeaderJSX);

// Wait! The regex above might be too greedy. Let's do a more precise replacement.
const preciseRegex = /<View style=\{styles\.container\}>[\s\S]*?\{loading \? \(/;
code = code.replace(preciseRegex, newHeaderJSX + "\n      {loading ? (");

// Filter books by search query in FlatList data prop
code = code.replace(/data=\{books\}/, "data={books.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || (b.author && b.author.toLowerCase().includes(searchQuery.toLowerCase())))}");

// Update Styles
const newStyles = `
  heroSection: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 48,
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  heroStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 24,
    alignItems: 'center',
  },
  heroStatItem: {
    alignItems: 'center',
  },
  heroStatNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  searchWrapper: {
    paddingHorizontal: 24,
    marginTop: -26,
    marginBottom: 20,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 54,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: colors.text,
  },
`;

code = code.replace(/heroSection: \{[\s\S]*?loadingText: \{/g, newStyles + "\n  loadingText: {");

// We need to fix the case where old header style keys like "headerArea", "header", "headerTitle", "heroIconWrap" might be left unused or if the regex failed.
// The precise regex `heroSection: \{[\s\S]*?loadingText: \{` will wipe them out up to `loadingText`. This perfectly matches what we want to replace.

fs.writeFileSync('app/(tabs)/books.tsx', code);
console.log('Books header redesigned and search added!');
