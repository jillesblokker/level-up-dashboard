require('ts-node').register({ transpileOnly: true });
const { defaultInventoryItems } = require('../app/lib/default-inventory.ts');
console.log(defaultInventoryItems.length);
