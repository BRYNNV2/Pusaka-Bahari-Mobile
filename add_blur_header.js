const fs = require('fs');
let code = fs.readFileSync('app/profile.tsx', 'utf8');

// 1. Add BlurView import
if (!code.includes('expo-blur')) {
  code = code.replace(/import \{ LinearGradient \} from 'expo-linear-gradient';/, 
    "import { LinearGradient } from 'expo-linear-gradient';\nimport { BlurView } from 'expo-blur';");
}

// 2. Change absoluteHeader style to be transparent
code = code.replace(/absoluteHeader: \{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999, backgroundColor: isDark \? colors\.backgroundSecondary : '#0f172a' \}/, 
  "absoluteHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999 }");

// 3. Inject BlurView into absoluteHeader
const searchStr = `<SafeAreaView edges={['top']} style={styles.absoluteHeader}>`;
const replaceStr = `<SafeAreaView edges={['top']} style={styles.absoluteHeader}>
        <BlurView intensity={80} tint={isDark ? 'dark' : 'dark'} style={StyleSheet.absoluteFill} />`;

if (code.includes(searchStr)) {
  code = code.replace(searchStr, replaceStr);
  fs.writeFileSync('app/profile.tsx', code);
  console.log('BlurView added!');
} else {
  console.log('Search string not found!');
}
