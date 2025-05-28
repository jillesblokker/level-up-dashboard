const fs = require('fs');
const path = require('path');

const filesToFix = [
  'app/category/[slug]/page.tsx',
  'app/city/[cityName]/tavern/page.tsx',
  'app/events/page.tsx',
  'app/friend-stats/page.tsx',
  'app/kingdom/kingdom-client.tsx',
  'app/notifications/page.tsx',
  'app/realm/page.tsx',
  'app/riddles/page.tsx',
  'app/rivals/page.tsx',
  'app/settings/events/page.tsx',
  'components/battle-modal.tsx',
  'components/category-modals/condition-workout-form.tsx',
  'components/category-modals/knowledge-workout-form.tsx',
  'components/category-modals/nutrition-workout-form.tsx',
  'components/community-fix.tsx',
  'components/onboarding-guide.tsx',
  'components/strength-workout-form.tsx',
  'components/town-view.tsx'
];

function fixUnescapedEntities(content) {
  return content
    .replace(/(?<!=["'])'/g, '&apos;')
    .replace(/(?<!=["'])"/g, '&quot;');
}

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const fixedContent = fixUnescapedEntities(content);
    fs.writeFileSync(fullPath, fixedContent);
    console.log(`Fixed unescaped entities in ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}); 