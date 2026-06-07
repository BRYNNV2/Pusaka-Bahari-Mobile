const fs = require('fs');

let code = fs.readFileSync('app/admin/index.tsx', 'utf8');

// The following elements are usually on top of primary color or dark overlays, so their text/icons MUST be white

code = code.replace(/<Text style=\{\{ color: colors\.card, fontSize: 12, marginTop: 6 \}\}>Mengupload\.\.\.<\/Text>/g, 
  '<Text style={{ color: "#ffffff", fontSize: 12, marginTop: 6 }}>Mengupload...</Text>');

code = code.replace(/<Text style=\{\{ fontSize: 13, fontWeight: '700', color: colors\.card \}\}>Perbarui<\/Text>/g, 
  '<Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff" }}>Perbarui</Text>');

code = code.replace(/<Text style=\{\{ fontSize: 13, fontWeight: '700', color: colors\.card \}\}>Simpan Media<\/Text>/g, 
  '<Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff" }}>Simpan Media</Text>');

code = code.replace(/color: gMediaType === type \? colors\.card : colors\.textSecondary/g, 
  'color: gMediaType === type ? "#ffffff" : colors.textSecondary');

code = code.replace(/<Feather name=\{tab\.icon as any\} size=\{18\} color=\{activeTab === tab\.id \? colors\.card : colors\.textSecondary\} \/>/g, 
  '<Feather name={tab.icon as any} size={18} color={activeTab === tab.id ? "#ffffff" : colors.textSecondary} />');

code = code.replace(/<Text style=\{\[styles\.statCount, activeTab === tab\.id && \{ color: colors\.card \}\]\}>\{stats\[tab\.id\]\}<\/Text>/g, 
  '<Text style={[styles.statCount, activeTab === tab.id && { color: "#ffffff" }]}>{stats[tab.id]}</Text>');

code = code.replace(/typeChipTextActive: \{ color: colors\.card \}/g, 
  'typeChipTextActive: { color: "#ffffff" }');

code = code.replace(/saveBtnText: \{ fontSize: 15, fontWeight: '700', color: colors\.card \}/g, 
  'saveBtnText: { fontSize: 15, fontWeight: "700", color: "#ffffff" }');

code = code.replace(/mapPickerMarkerDot: \{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors\.text, borderWidth: 2, borderColor: colors\.card \}/g, 
  'mapPickerMarkerDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primary, borderWidth: 2, borderColor: "#ffffff" }');

fs.writeFileSync('app/admin/index.tsx', code);
console.log('Admin colors fixed!');
