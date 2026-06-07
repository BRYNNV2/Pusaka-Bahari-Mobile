const fs = require('fs');

let code = fs.readFileSync('app/login.tsx', 'utf8');

// Add useTheme import
if (!code.includes('useTheme')) {
  code = code.replace(/import \{ useAuth \} from '@\/contexts\/AuthContext';/, "import { useAuth } from '@/contexts/AuthContext';\nimport { useTheme } from '@/contexts/ThemeContext';");
}

// Add hooks
code = code.replace(/export default function LoginScreen\(\) \{/, `export default function LoginScreen() {
  const { mode, isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);`);

// Refactor StyleSheet.create
code = code.replace(/const styles = StyleSheet\.create\({/, `const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({`);

// Ensure container is colors.background
code = code.replace(/container: \{\s+flex: 1,\s+backgroundColor: ['"]#(?:ffffff|fff|f8fafc)['"]\s*\}/, "container: {\n    flex: 1,\n    backgroundColor: colors.background\n  }");
code = code.replace(/card: \{\s+backgroundColor: ['"]#(?:ffffff|fff)['"]/, "card: {\n    backgroundColor: colors.card");

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
code = code.replace(/'#dc2626'/g, 'colors.danger');
code = code.replace(/'#fef2f2'/g, 'isDark ? "rgba(220, 38, 38, 0.1)" : "#fef2f2"');
code = code.replace(/'#fecaca'/g, 'isDark ? "rgba(220, 38, 38, 0.3)" : "#fecaca"');

// Hardcoded "white"
code = code.replace(/'white'/g, 'colors.card');

// Inline colors replacement
code = code.replace(/color="#0f172a"/g, 'color={colors.text}');
code = code.replace(/color="#ffffff"/g, 'color={colors.background}');
code = code.replace(/color="#94a3b8"/g, 'color={colors.textSecondary}');
code = code.replace(/color="#64748b"/g, 'color={colors.textSecondary}');
code = code.replace(/color="#fff"/g, 'color={colors.background}');

// Exceptions
// Button background: backgroundColor: colors.text -> Text color: colors.card
// We want to make sure the submitBtn text is colors.card and icon is colors.card (or colors.background).
// I will check the file again if it fails.

// Specific placeholders
code = code.replace(/placeholderTextColor="#94a3b8"/g, "placeholderTextColor={colors.textSecondary}");

fs.writeFileSync('app/login.tsx', code);
console.log('Login refactored!');
