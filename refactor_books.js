const fs = require('fs');

let code = fs.readFileSync('app/(tabs)/books.tsx', 'utf8');

// Add useTheme import
if (!code.includes('useTheme')) {
  code = code.replace(/import \{ useFocusEffect \} from 'expo-router';/, "import { useFocusEffect } from 'expo-router';\nimport { useTheme } from '@/contexts/ThemeContext';");
}

// Add hooks
code = code.replace(/export default function BooksScreen\(\) \{/, `export default function BooksScreen() {
  const { mode, isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);`);

// Modify StatusBar
code = code.replace(/<StatusBar barStyle="dark-content" \/>/g, `<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />`);
code = code.replace(/<StatusBar barStyle="dark-content" translucent backgroundColor="transparent" \/>/g, `<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />`);
// Specific StatusBar from catalog-like files
code = code.replace(/<StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent=\{false\} \/>/g, `<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} translucent={false} />`);

// Refactor StyleSheet.create
code = code.replace(/const styles = StyleSheet\.create\({/, `const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({`);

// Ensure container is colors.background
code = code.replace(/container: \{\s+flex: 1,\s+backgroundColor: ['"]#(?:ffffff|fff)['"]\s*\}/, "container: {\n    flex: 1,\n    backgroundColor: colors.background\n  }");
code = code.replace(/container: \{\s+flex: 1,\s+backgroundColor: colors\.card/, "container: {\n    flex: 1,\n    backgroundColor: colors.background");

// Color mappings in StyleSheet
code = code.replace(/'#ffffff'/g, 'colors.card');
code = code.replace(/'#fff'/g, 'colors.card');
code = code.replace(/'#f8fafc'/g, 'colors.backgroundSecondary');
code = code.replace(/'#fdf2e9'/g, 'colors.backgroundSecondary');
code = code.replace(/'#f1f5f9'/g, 'colors.border');
code = code.replace(/'#e2e8f0'/g, 'colors.border');
code = code.replace(/'#cbd5e1'/g, 'colors.border');
code = code.replace(/'#94a3b8'/g, 'colors.textSecondary');
code = code.replace(/'#64748b'/g, 'colors.textSecondary');
code = code.replace(/'#475569'/g, 'colors.textSecondary');
code = code.replace(/'#0f172a'/g, 'colors.text');
code = code.replace(/'#8B5E3C'/g, 'colors.primary');

// Hardcoded "white"
code = code.replace(/'white'/g, 'colors.card');

// Inline colors replacement
code = code.replace(/color="#0f172a"/g, 'color={colors.text}');
code = code.replace(/color="#ffffff"/g, 'color={colors.background}');
code = code.replace(/color="#94a3b8"/g, 'color={colors.textSecondary}');
code = code.replace(/color="#64748b"/g, 'color={colors.textSecondary}');
code = code.replace(/color="#fff"/g, 'color={colors.background}');
code = code.replace(/color="#8B5E3C"/g, 'color={colors.primary}');

// Specific placeholders
code = code.replace(/placeholderTextColor="#94a3b8"/g, "placeholderTextColor={colors.textSecondary}");

fs.writeFileSync('app/(tabs)/books.tsx', code);
console.log('Books refactored!');
