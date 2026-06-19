const fs = require('fs');
const file = 'app/kingdom/kingdom-client.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the fallback logic
const target = `      // If no items are equipped, show default inventory items as a fallback
      if (normEquipped.length === 0) {
        const defaults = defaultInventoryItems.map(item => ({
          ...item,
          stats: item.stats || {},
          description: item.description || '',
          equipped: true,
          type: item.type as any,
          category: item.type,
        })) as KingdomInventoryItem[];
        setEquippedItems(defaults);
      } else {
        setEquippedItems(normEquipped);
      }
      
      setStoredItems(normalize(stored));`;

const replacement = `      let finalEquipped = normEquipped;
      let finalStored = normalize(stored);

      if (finalEquipped.length === 0 && (defaultInventoryItems || []).length > 0) {
        try {
          const defaults = defaultInventoryItems.map(item => ({
            ...item,
            stats: item.stats || {},
            description: item.description || '',
            equipped: true,
            type: item.type as any,
            category: item.type,
          })) as KingdomInventoryItem[];
          finalEquipped = defaults;
        } catch (e) {
          logger.warn('[Kingdom] Default mapping failed', e);
        }
      }

      setEquippedItems(finalEquipped);
      setStoredItems(finalStored);`;

content = content.replace(target, replacement);

const target2 = `    } catch (error) {
      logger.error('[Kingdom] Inventory load failed:', error);
    } finally {`;

const replacement2 = `    } catch (error) {
      logger.error('[Kingdom] Inventory load failed with exception:', error);
      try {
        if ((defaultInventoryItems || []).length > 0) {
          const defaults = defaultInventoryItems.map(item => ({
            ...item,
            stats: item.stats || {},
            description: item.description || '',
            equipped: true,
            type: item.type as any,
            category: item.type,
          })) as KingdomInventoryItem[];
          setEquippedItems(defaults);
        }
      } catch (e) {}
    } finally {`;

content = content.replace(target2, replacement2);
fs.writeFileSync(file, content);
