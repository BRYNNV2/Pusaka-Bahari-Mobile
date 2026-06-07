const fs = require('fs');

let code = fs.readFileSync('app/notifications.tsx', 'utf8');

// Add useTheme import
if (!code.includes('useTheme')) {
  code = code.replace(/import \{ useAuth \} from '@\/contexts\/AuthContext';/, "import { useAuth } from '@/contexts/AuthContext';\nimport { useTheme } from '@/contexts/ThemeContext';");
}

// Add hooks
code = code.replace(/export default function NotificationsScreen\(\) \{/, `export default function NotificationsScreen() {
  const { mode, isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);`);

// Modify StatusBar
code = code.replace(/<StatusBar barStyle="dark-content" backgroundColor="#ffffff" \/>/g, `<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />`);

// Refactor renderIcon
code = code.replace(/<View style=\{\[styles\.iconWrap, \{ backgroundColor: config\.bg \}\]\}>/, "<View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : config.bg }]}>");

// Refactor StyleSheet.create
code = code.replace(/const styles = StyleSheet\.create\({/, `const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({`);

// Ensure container is colors.background
code = code.replace(/container: \{\s+flex: 1,\s+backgroundColor: ['"]#f8fafc['"]\s*\}/, "container: {\n    flex: 1,\n    backgroundColor: colors.background\n  }");

// Color mappings in StyleSheet
code = code.replace(/'#ffffff'/g, 'colors.card');
code = code.replace(/'#fff'/g, 'colors.card');
code = code.replace(/'#f8fafc'/g, 'colors.backgroundSecondary');
code = code.replace(/'#f1f5f9'/g, 'colors.border');
code = code.replace(/'#cbd5e1'/g, 'colors.border');
code = code.replace(/'#94a3b8'/g, 'colors.textSecondary');
code = code.replace(/'#64748b'/g, 'colors.textSecondary');
code = code.replace(/'#0f172a'/g, 'colors.text');

// Hardcoded "white"
code = code.replace(/'white'/g, 'colors.card');

// Inline colors replacement
code = code.replace(/color="#0f172a"/g, 'color={colors.text}');
code = code.replace(/color="#ffffff"/g, 'color={colors.background}');
code = code.replace(/color="#cbd5e1"/g, 'color={colors.border}');
// There's a bell-off icon with #cbd5e1

fs.writeFileSync('app/notifications.tsx', code);
console.log('Notifications refactored!');
