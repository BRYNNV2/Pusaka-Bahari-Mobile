const fs = require('fs');

let code = fs.readFileSync('app/(tabs)/gallery.tsx', 'utf8');

// 1. Add searchQuery state
code = code.replace(/const \[galleryLoadingMore, setGalleryLoadingMore\] = useState\(false\);/, 
  "const [galleryLoadingMore, setGalleryLoadingMore] = useState(false);\n  const [searchQuery, setSearchQuery] = useState('');"
);

// 2. Modify fetchGalleryPhotos
code = code.replace(/const fetchGalleryPhotos = async \(pageNum = 0, append = false\) => \{/, 
  "const fetchGalleryPhotos = async (pageNum = 0, append = false, query = searchQuery) => {"
);

code = code.replace(/const \{ data \} = await supabase\s*\n\s*\.from\('gallery_items'\)\s*\n\s*\.select\('\*, artifacts\(name, type, year, description\)'\)\s*\n\s*\.or\('image_url\.neq\."",video_url\.neq\.""'\)\s*\n\s*\.order\('id', \{ ascending: false \}\)\s*\n\s*\.range\(from, to\);/, 
`let queryBuilder = supabase
      .from('gallery_items')
      .select('*, artifacts(name, type, year, description)')
      .or('image_url.neq."",video_url.neq.""');

    if (query) {
      queryBuilder = queryBuilder.ilike('title', \`%\${query}%\`);
    }

    const { data } = await queryBuilder
      .order('id', { ascending: false })
      .range(from, to);`
);

// 3. Update loadMoreGallery
code = code.replace(/fetchGalleryPhotos\(galleryPage \+ 1, true\);/, "fetchGalleryPhotos(galleryPage + 1, true, searchQuery);");

// 4. Update useFocusEffect to call fetchGalleryPhotos(0, false, searchQuery) when searchQuery changes?
// Wait, useFocusEffect only runs on focus. If they type, we need a useEffect or a search handler.
code = code.replace(/useFocusEffect\(\s*useCallback\(\(\) => \{\s*fetchGalleryPhotos\(0, false\);\s*\}, \[\]\)\s*\);/, 
`useFocusEffect(
    useCallback(() => {
      fetchGalleryPhotos(0, false, searchQuery);
    }, [])
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchGalleryPhotos(0, false, searchQuery);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);`
);

// 5. Add search bar to UI
const searchBarJSX = `
        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Feather name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari foto, video, atau musik..."
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

code = code.replace(/<Text style=\{styles\.sectionTitle\}>Daftar Putar<\/Text>/, searchBarJSX + "\n        <Text style={styles.sectionTitle}>Daftar Putar</Text>");

// 6. Filter playlist in UI
code = code.replace(/playlist\.map\(item => \(/, "playlist.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.desc.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (");

// 7. Add styles for search bar
const searchStyles = `
  searchWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
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

code = code.replace(/scrollContainer: \{/, searchStyles + "\n  scrollContainer: {");

// Wait, TextInput is not imported from react-native! Let's make sure it is.
// I will check the imports.

fs.writeFileSync('app/(tabs)/gallery.tsx', code);
console.log('Search added to gallery!');
