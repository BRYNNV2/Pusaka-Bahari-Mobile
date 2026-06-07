const fs = require('fs');

let code = fs.readFileSync('app/admin/index.tsx', 'utf8');

// Add useTheme import
if (!code.includes('useTheme')) {
  code = code.replace(/import \{ useAuth \} from '@\/contexts\/AuthContext';/, "import { useAuth } from '@/contexts/AuthContext';\nimport { useTheme } from '@/contexts/ThemeContext';");
}

// Add hooks
code = code.replace(/export default function AdminPanel\(\) \{/, `export default function AdminPanel() {
  const { mode, isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);`);

// Modify StatusBar
code = code.replace(/<StatusBar barStyle="dark-content" backgroundColor="#ffffff" \/>/g, `<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />`);
code = code.replace(/<StatusBar barStyle="dark-content" translucent backgroundColor="transparent" \/>/g, `<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />`);

// Refactor StyleSheet.create
code = code.replace(/const styles = StyleSheet\.create\({/, `const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({`);

// Fix container background
code = code.replace(/container: \{ flex: 1, backgroundColor: ['"]#f8fafc['"] \}/, "container: { flex: 1, backgroundColor: colors.backgroundSecondary }");
code = code.replace(/safeTop: \{ backgroundColor: ['"]#ffffff['"], borderBottomWidth: 1, borderBottomColor: ['"]#f1f5f9['"] \}/, "safeTop: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }");

// Replace all hardcoded colors within styles
// Instead of replacing globally which might break inline styles or logic, let's replace globally but be careful with strings.
code = code.replace(/'#ffffff'/g, 'colors.card');
code = code.replace(/'#fff'/g, 'colors.card');
code = code.replace(/'#f8fafc'/g, 'colors.backgroundSecondary');
code = code.replace(/'#fdfbf7'/g, 'colors.backgroundSecondary');
code = code.replace(/'#f1f5f9'/g, 'colors.border');
code = code.replace(/'#e2e8f0'/g, 'colors.border');
code = code.replace(/'#cbd5e1'/g, 'colors.border');
code = code.replace(/'#94a3b8'/g, 'colors.textSecondary');
code = code.replace(/'#64748b'/g, 'colors.textSecondary');
code = code.replace(/'#475569'/g, 'colors.textSecondary');
code = code.replace(/'#334155'/g, 'colors.textSecondary');
code = code.replace(/'#0f172a'/g, 'colors.text');
code = code.replace(/'#8B5E3C'/g, 'colors.primary');

// Replace "white" string specifically inside color values
code = code.replace(/color:\s*'white'/g, 'color: colors.card');
code = code.replace(/backgroundColor:\s*'white'/g, 'backgroundColor: colors.card');

// Inline color replacements
code = code.replace(/color="#0f172a"/g, 'color={colors.text}');
code = code.replace(/color="#ffffff"/g, 'color={colors.card}');
code = code.replace(/color="#94a3b8"/g, 'color={colors.textSecondary}');
code = code.replace(/color="#64748b"/g, 'color={colors.textSecondary}');
code = code.replace(/color="#fff"/g, 'color={colors.card}');
code = code.replace(/color="#8B5E3C"/g, 'color={colors.primary}');
code = code.replace(/placeholderTextColor="#94a3b8"/g, "placeholderTextColor={colors.textSecondary}");

// Add specific handling for modals that had hardcoded overlay
code = code.replace(/backgroundColor: 'rgba\(0,0,0,0\.4\)'/g, "backgroundColor: 'rgba(0,0,0,0.6)'");

fs.writeFileSync('app/admin/index.tsx', code);
console.log('Admin refactored!');
