const fs = require('fs');
let code = fs.readFileSync('app/(tabs)/map.tsx', 'utf8');

code = code.replace(/'white'/g, 'colors.card');
code = code.replace(/'rgba\(255,255,255,0.7\)'/g, 'isDark ? "rgba(30, 41, 59, 0.8)" : "rgba(255,255,255,0.7)"');

fs.writeFileSync('app/(tabs)/map.tsx', code);
console.log('Fixed white backgrounds in map.tsx');
