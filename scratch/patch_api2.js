const fs = require('fs');
const file = 'app/api/inventory/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/await supabase\n/g, 'await supabaseServer\n');
content = content.replace(/await supabase\./g, 'await supabaseServer.');
content = content.replace(/await supabase /g, 'await supabaseServer ');

fs.writeFileSync(file, content);
