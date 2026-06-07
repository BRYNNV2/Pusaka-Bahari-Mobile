const fs = require('fs');

let code = fs.readFileSync('app/(tabs)/gallery.tsx', 'utf8');

// Import useTheme
if (!code.includes('useTheme')) {
  code = code.replace(/import \{ supabase \} from '@\/lib\/supabase';/, "import { supabase } from '@/lib/supabase';\nimport { useTheme } from '@/contexts/ThemeContext';");
}

// Add hooks
code = code.replace(/export default function GalleryScreen\(\) \{/, `export default function GalleryScreen() {
  const { mode, isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);`);

// Modify StatusBar
code = code.replace(/<StatusBar barStyle="dark-content" translucent backgroundColor="transparent" \/>/, `<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />`);
// Sometime it's without attributes:
code = code.replace(/<StatusBar barStyle="dark-content" \/>/, `<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />`);

// Refactor StyleSheet.create
code = code.replace(/const styles = StyleSheet\.create\({/, `const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({`);

// Color mappings in StyleSheet
code = code.replace(/'#ffffff'/g, 'colors.card');
code = code.replace(/'#fff'/g, 'colors.card');
code = code.replace(/'#fcfdfe'/g, 'colors.background'); // just in case
code = code.replace(/'#f8fafc'/g, 'colors.backgroundSecondary');
code = code.replace(/'#f1f5f9'/g, 'colors.border');
code = code.replace(/'#e2e8f0'/g, 'colors.border');
code = code.replace(/'#cbd5e1'/g, 'colors.border');
code = code.replace(/'#94a3b8'/g, 'colors.textSecondary');
code = code.replace(/'#64748b'/g, 'colors.textSecondary');
code = code.replace(/'#475569'/g, 'colors.text');
code = code.replace(/'#334155'/g, 'colors.text');
code = code.replace(/'#1e293b'/g, 'colors.text');
code = code.replace(/'#0f172a'/g, 'colors.text');
code = code.replace(/'#ef4444'/g, 'colors.danger');
// Wait, fbbf24 and f59e0b are usually gold/primary
code = code.replace(/'#fbbf24'/g, 'colors.primary');
code = code.replace(/'#f59e0b'/g, 'colors.primary');

// Specific literal 'white'
code = code.replace(/'white'/g, 'colors.card');

// Inline colors replacement
code = code.replace(/color="#0f172a"/g, 'color={colors.text}');
code = code.replace(/color="#ffffff"/g, 'color={colors.background}');
code = code.replace(/color="#94a3b8"/g, 'color={colors.textSecondary}');
code = code.replace(/color="#64748b"/g, 'color={colors.textSecondary}');
code = code.replace(/color="#fff"/g, 'color={colors.background}');

// Exceptions: Overlay texts might need to remain white
// Let's do a post-fix for typical modal close buttons or image overlays
// E.g., backgroundColor: 'rgba(0,0,0,0.5)' should remain.

// Revert container background to colors.background instead of colors.card
code = code.replace(/container: \{\s+flex: 1,\s+backgroundColor: colors\.card/g, "container: {\n    flex: 1,\n    backgroundColor: colors.background");

fs.writeFileSync('app/(tabs)/gallery.tsx', code);
console.log('Gallery refactored!');
