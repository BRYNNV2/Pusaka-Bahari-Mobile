const fs = require('fs');

let code = fs.readFileSync('app/notifications.tsx', 'utf8');

// 1. Add hiddenIds state
code = code.replace(/const \[loading, setLoading\] = useState\(true\);/, 
  "const [loading, setLoading] = useState(true);\n  const [hiddenIds, setHiddenIds] = useState<number[]>([]);"
);

// 2. Modify fetchNotifications
code = code.replace(/const fetchNotifications = async \(\) => \{[\s\S]*?await AsyncStorage\.setItem[^}]*\};\s*\}, \[\]\)/, 
`const fetchNotifications = async () => {
    setLoading(true);
    const uid = user?.id || 'guest';
    const hiddenStr = await AsyncStorage.getItem(\`hiddenNotifs_\${uid}\`);
    const hidden = hiddenStr ? JSON.parse(hiddenStr) : [];
    setHiddenIds(hidden);

    const { data: rows } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
    const filtered = (rows as NotifItem[] || []).filter(n => !hidden.includes(n.id));
    setData(filtered);
    setLoading(false);

    await AsyncStorage.setItem(\`lastNotifRead_\${uid}\`, new Date().toISOString());
  };

  const deleteNotif = async (id: number) => {
    const uid = user?.id || 'guest';
    const newHidden = [...hiddenIds, id];
    setHiddenIds(newHidden);
    setData(prev => prev.filter(n => n.id !== id));
    await AsyncStorage.setItem(\`hiddenNotifs_\${uid}\`, JSON.stringify(newHidden));
  };

  const clearAll = async () => {
    if (data.length === 0) return;
    Alert.alert('Bersihkan Notifikasi', 'Hapus semua notifikasi ini dari layar Anda?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Ya, Bersihkan', onPress: async () => {
        const uid = user?.id || 'guest';
        const allIdsToHide = [...hiddenIds, ...data.map(n => n.id)];
        setHiddenIds(allIdsToHide);
        setData([]);
        await AsyncStorage.setItem(\`hiddenNotifs_\${uid}\`, JSON.stringify(allIdsToHide));
      }}
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])`
);

// 3. Add delete button in renderItem
code = code.replace(/<Text style=\{styles\.cardTime\}>\{getTimeAgo\(item\.created_at\)\}<\/Text>\s*<\/View>\s*<\/View>/, 
`<View style={styles.cardFooter}>
          <Text style={styles.cardTime}>{getTimeAgo(item.created_at)}</Text>
          <TouchableOpacity style={styles.delBtn} onPress={() => deleteNotif(item.id)}>
            <Feather name="x" size={14} color={colors.textSecondary} />
            <Text style={styles.delBtnText}>Hapus</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>`
);

// 4. Update Header with Clear All button
code = code.replace(/<View style=\{\{ width: 40 \}\} \/>/, 
  `<TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
            <Feather name="trash-2" size={20} color={data.length > 0 ? colors.danger : colors.textSecondary} />
          </TouchableOpacity>`
);

// 5. Update Styles
const newStyles = `
  clearBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  delBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  delBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
`;

code = code.replace(/iconWrap: \{/, newStyles + "\n  iconWrap: {");

fs.writeFileSync('app/notifications.tsx', code);
console.log('Delete and Clear functionality added to notifications!');
