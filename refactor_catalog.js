const fs = require('fs');

let code = fs.readFileSync('app/(tabs)/catalog.tsx', 'utf8');

// Add useTheme import
if (!code.includes('useTheme')) {
  code = code.replace(/import \{ useFocusEffect \} from 'expo-router';/, "import { useFocusEffect } from 'expo-router';\nimport { useTheme } from '@/contexts/ThemeContext';");
}

// Add hooks
code = code.replace(/export default function CatalogScreen\(\) \{/, `export default function CatalogScreen() {
  const { mode, isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);`);

// Modify StatusBar
code = code.replace(/<StatusBar barStyle="dark-content" \/>/g, `<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />`);
code = code.replace(/<StatusBar barStyle="dark-content" translucent backgroundColor="transparent" \/>/g, `<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />`);

// Refactor StyleSheet.create
code = code.replace(/const styles = StyleSheet\.create\({/, `const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({`);

// Color mappings in StyleSheet
code = code.replace(/'#ffffff'/g, 'colors.card');
code = code.replace(/'#fff'/g, 'colors.card');
code = code.replace(/'#f8fafc'/g, 'colors.backgroundSecondary');
code = code.replace(/'#f1f5f9'/g, 'colors.border');
code = code.replace(/'#e2e8f0'/g, 'colors.border');
code = code.replace(/'#94a3b8'/g, 'colors.textSecondary');
code = code.replace(/'#64748b'/g, 'colors.textSecondary');
code = code.replace(/'#475569'/g, 'colors.textSecondary');
code = code.replace(/'#0f172a'/g, 'colors.text');
code = code.replace(/'#3c2415'/g, 'colors.text');

// Inline colors replacement
code = code.replace(/color="#0f172a"/g, 'color={colors.text}');
code = code.replace(/color="#ffffff"/g, 'color={colors.background}');
code = code.replace(/color="#94a3b8"/g, 'color={colors.textSecondary}');
code = code.replace(/color="#64748b"/g, 'color={colors.textSecondary}');
code = code.replace(/color="#3c2415"/g, 'color={colors.text}');
code = code.replace(/color="#fff"/g, 'color={colors.background}');
code = code.replace(/color="#ef4444"/g, 'color={colors.danger}');

// Hardcoded "white"
code = code.replace(/'white'/g, 'colors.card');

// Dynamic overrides for type badges
// Instead of { backgroundColor: typeStyle.bg }
// Use: { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : typeStyle.bg }
// Wait, typeStyle is from TYPE_COLORS. 
// If it's undefined, it used { bg: '#f1f5f9', text: '#475569', icon: 'info' }
code = code.replace(/\{ bg: '#f1f5f9', text: '#475569', icon: 'info' \}/g, "{ bg: isDark ? colors.backgroundSecondary : '#f1f5f9', text: colors.textSecondary, icon: 'info' }");

code = code.replace(/\{ backgroundColor: typeStyle\.bg \}/g, "{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : typeStyle.bg }");
// For the kamus bullet points
code = code.replace(/backgroundColor: '#f1f5f9'/g, "backgroundColor: colors.backgroundSecondary");

// Ensure container is colors.background
code = code.replace(/container: \{\s+flex: 1,\s+backgroundColor: colors\.card/g, "container: {\n    flex: 1,\n    backgroundColor: colors.background");

fs.writeFileSync('app/(tabs)/catalog.tsx', code);
console.log('Catalog refactored!');
