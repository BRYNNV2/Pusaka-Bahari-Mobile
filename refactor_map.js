const fs = require('fs');

let code = fs.readFileSync('app/(tabs)/map.tsx', 'utf8');

// Add useTheme import
code = code.replace(/import \{ supabase \} from '@\/lib\/supabase';/, "import { supabase } from '@/lib/supabase';\nimport { useTheme } from '@/contexts/ThemeContext';");

// Add hooks
code = code.replace(/export default function MapScreen\(\) \{/, `export default function MapScreen() {
  const { mode, isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);`);

// Modify StatusBar and StrokeColor
code = code.replace(/<StatusBar barStyle="dark-content" \/>/, `<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />`);
code = code.replace(/strokeColor="#0f172a"/, `strokeColor={colors.primary}`);
code = code.replace(/strokeColor="#1e293b"/g, `strokeColor={colors.primary}`);

// Refactor StyleSheet.create
code = code.replace(/const styles = StyleSheet\.create\({/, `const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({`);

// Color mappings in StyleSheet
code = code.replace(/'#ffffff'/g, 'colors.card');
code = code.replace(/'#0f172a'/g, 'colors.text');
code = code.replace(/'#475569'/g, 'colors.text');
code = code.replace(/'#64748b'/g, 'colors.textSecondary');
code = code.replace(/'#94a3b8'/g, 'colors.textSecondary');
code = code.replace(/'#f1f5f9'/g, 'colors.border');

// Replace any remaining inline colors
code = code.replace(/color="#0f172a"/g, 'color={colors.text}');
code = code.replace(/color="#ffffff"/g, 'color={colors.background}');
code = code.replace(/color="#94a3b8"/g, 'color={colors.textSecondary}');

// Let's also modify CartoDB dark theme if dark mode is active!
// Voyager is light. Dark Matter is dark.
const urlTileReplacement = `{Platform.OS === 'android' && (
          <UrlTile
            urlTemplate={isDark 
              ? "https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png"
              : "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
            }
            maximumZ={19}
            flipY={false}
          />
        )}`;
code = code.replace(/\{Platform\.OS === 'android' && \([\s\S]*?<UrlTile[\s\S]*?\/>\s*\)\}/, urlTileReplacement);

// iOS map style for Dark mode
code = code.replace(/mapType=\{Platform\.OS == "android" \? "none" : "standard"\}/, `mapType={Platform.OS == "android" ? "none" : "standard"}
        userInterfaceStyle={isDark ? "dark" : "light"}`);

fs.writeFileSync('app/(tabs)/map.tsx', code);
console.log('Map refactored!');
