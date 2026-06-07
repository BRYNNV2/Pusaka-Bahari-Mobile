const fs = require('fs');

let code = fs.readFileSync('app/(tabs)/index.tsx', 'utf8');

code = code.replace(/import \{ useAuth \} from '@\/contexts\/AuthContext';/, "import { useAuth } from '@/contexts/AuthContext';\nimport { useTheme } from '@/contexts/ThemeContext';");

code = code.replace(/export default function HomeScreen\(\) \{/, `export default function HomeScreen() {
  const { mode, isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);`);

code = code.replace(/const styles = StyleSheet\.create\({/, `const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({`);

code = code.replace(/'#ffffff'/g, 'colors.background');
code = code.replace(/'#0f172a'/g, 'colors.text');
code = code.replace(/'#f8fafc'/g, 'colors.backgroundSecondary');
code = code.replace(/'#f1f5f9'/g, 'colors.border');
code = code.replace(/'#64748b'/g, 'colors.textSecondary');
code = code.replace(/'#e2e8f0'/g, 'colors.border');
code = code.replace(/'#94a3b8'/g, 'colors.textSecondary');
code = code.replace(/'#ef4444'/g, 'colors.danger');
code = code.replace(/'#8B5E3C'/g, 'colors.primary');

code = code.replace(/color="#0f172a"/g, 'color={colors.text}');
code = code.replace(/color="#ffffff"/g, 'color={colors.background}');
code = code.replace(/color="#8B5E3C"/g, 'color={colors.primary}');
code = code.replace(/tintColor="#8B5E3C"/g, 'tintColor={colors.primary}');
code = code.replace(/colors={\['#8B5E3C'\]}/g, 'colors={[colors.primary]}');

fs.writeFileSync('app/(tabs)/index.tsx', code);
console.log('Done refactoring index.tsx!');
