const fs = require('fs');
const file = 'app/kingdom/kingdom-client.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetImport = `import { fetchWithAuth } from '@/lib/fetchWithAuth'`;
const replacementImport = `import { fetchWithAuth } from '@/lib/fetchWithAuth'\nimport { supabase, withToken } from '@/lib/supabase/client'`;
content = content.replace(targetImport, replacementImport);

const targetFetch = `      // 1. Fetch Parallel Data
      const [inventoryRes, stats, challengesResponse] = await Promise.all([
        fetch('/api/inventory').catch(() => null),
        getTotalStats(user.id),
        fetch('/api/challenges-ultra-simple').catch(() => null)
      ]);

      let allItems = [];
      if (inventoryRes?.ok) {
        try {
          const json = await inventoryRes.json();
          if (json.success && Array.isArray(json.data)) {
            allItems = json.data;
          }
        } catch (e) {
          logger.warn('[Kingdom] Failed to parse inventory JSON', e);
        }
      } else {
        console.error('[Kingdom] inventoryRes was not ok! Status:', inventoryRes?.status);
      }`;

const replacementFetch = `      // 1. Fetch Parallel Data
      const [stats, challengesResponse] = await Promise.all([
        getTotalStats(user.id),
        fetch('/api/challenges-ultra-simple').catch(() => null)
      ]);

      let allItems = [];
      try {
        const { data, error } = await withToken(supabase, getToken, async (db) => {
          return await db.from('inventory_items').select('*').eq('user_id', user.id);
        });
        if (error) {
          logger.error('[Kingdom] Supabase direct inventory fetch error:', error);
        } else if (data) {
          allItems = data.map((row: any) => ({
            ...row,
            id: row.item_id,
            stats: row.stats || {},
          }));
        }
      } catch (err) {
        logger.error('[Kingdom] Supabase direct inventory fetch exception:', err);
        
        // Fallback to the API if direct supabase fails for some reason
        try {
          const inventoryRes = await fetch('/api/inventory');
          if (inventoryRes.ok) {
            const json = await inventoryRes.json();
            if (json.success && Array.isArray(json.data)) {
              allItems = json.data;
            }
          }
        } catch (fallbackErr) {}
      }`;

content = content.replace(targetFetch, replacementFetch);

const targetFallback = `      // If no items are equipped, show default inventory items as a fallback
      if (normEquipped.length === 0) {
        const defaults = defaultInventoryItems.map(item => ({`;
const replacementFallback = `      // If no items are equipped, show default inventory items as a fallback
      if (normEquipped.length === 0) {
        const defaults = (defaultInventoryItems || []).map(item => ({`;

content = content.replace(targetFallback, replacementFallback);

fs.writeFileSync(file, content);
