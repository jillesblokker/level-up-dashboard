const fs = require('fs');
const file = 'components/kingdom-properties-inventory.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  '{/* ─── MAIN CONTENT AREA ────────────────────────────────────────────────── */}',
  `{/* ─── MAIN CONTENT AREA ────────────────────────────────────────────────── */}
      <div className="bg-red-900 text-white text-[10px] p-1 m-2 rounded text-center z-50">
        DEBUG: prop_len={inventoryItems?.length}, equipped_len={equippedInventory.length}, stored_len={storedInventory.length}, filtered_len={filteredStored.length}
      </div>`
);
fs.writeFileSync(file, content);
