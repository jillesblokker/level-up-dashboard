const fs = require('fs');
const file = 'app/kingdom/kingdom-client.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'inventoryItems={[',
  'inventoryItems={[{ id: "test-item", name: "TEST ITEM", equipped: true, type: "weapon", rarity: "epic", stats: { attack: 100 } }], // '
);
fs.writeFileSync(file, content);
