const fs = require('fs');

let code = fs.readFileSync('app/(tabs)/gallery.tsx', 'utf8');
const lines = code.split('\n');

// We want to revert colors.text -> '#0f172a' and colors.background -> '#ffffff' and colors.card -> '#ffffff' 
// BUT ONLY within the Modal sections.
// Modal 1: FOTO DETAIL (approx line 501 to 684)
// Modal 2: MUSIC PLAYER (approx line 687 to 865)

for (let i = 500; i < 870; i++) {
  if (!lines[i]) continue;
  let line = lines[i];
  
  // Undo inversions
  line = line.replace(/colors\.textSecondary/g, "'#94a3b8'");
  line = line.replace(/colors\.text/g, "'#0f172a'");
  line = line.replace(/colors\.backgroundSecondary/g, "'#f8fafc'");
  line = line.replace(/colors\.background/g, "'#ffffff'");
  line = line.replace(/colors\.card/g, "'#ffffff'");
  line = line.replace(/colors\.danger/g, "'#ef4444'");
  line = line.replace(/colors\.border/g, "'#cbd5e1'");
  
  // Fix the arrays e.g. colors={['#0f172a', '#0f172a']}
  // It was previously LinearGradient colors={['#0f172a', '#0f172a']}
  
  lines[i] = line;
}

fs.writeFileSync('app/(tabs)/gallery.tsx', lines.join('\n'));
console.log('Reverted modals to dark mode!');
