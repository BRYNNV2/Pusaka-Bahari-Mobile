const fs = require('fs');

let code = fs.readFileSync('app/(tabs)/index.tsx', 'utf8');

// Replace any remaining inline colors
code = code.replace(/color="#[0-9a-fA-F]+"/g, (match) => {
  if (match.toLowerCase().includes('ffffff') || match.toLowerCase().includes('fff"')) return 'color={colors.background}';
  if (match.toLowerCase().includes('0f172a') || match.toLowerCase().includes('3c2415') || match.toLowerCase().includes('1e293b')) return 'color={colors.text}';
  if (match.toLowerCase().includes('64748b') || match.toLowerCase().includes('94a3b8') || match.toLowerCase().includes('cbd5e1')) return 'color={colors.textSecondary}';
  if (match.toLowerCase().includes('8b5e3c') || match.toLowerCase().includes('c8956c')) return 'color={colors.primary}';
  if (match.toLowerCase().includes('ef4444')) return 'color={colors.danger}';
  return match;
});

// For background colors in styles that might have been missed
code = code.replace(/'#fdf2e9'/g, 'colors.backgroundSecondary');
code = code.replace(/'#f5f0eb'/g, 'colors.backgroundSecondary');
code = code.replace(/'#e8ddd2'/g, 'colors.border');
code = code.replace(/'#3c2415'/g, 'colors.text');
code = code.replace(/'#fff'/g, 'colors.background');
code = code.replace(/'#cbd5e1'/g, 'colors.textSecondary');
code = code.replace(/'#fbbf24'/g, 'colors.primary');

fs.writeFileSync('app/(tabs)/index.tsx', code);
console.log('Done deep refactoring index.tsx!');
