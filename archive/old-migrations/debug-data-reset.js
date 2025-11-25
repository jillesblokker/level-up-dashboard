// Debug script to check data status
// Run this in browser console to diagnose data issues

console.log('=== DATA DIAGNOSTIC ===');

// Check localStorage
console.log('localStorage items:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log(`${key}:`, value);
}

// Check character stats specifically
const characterStats = localStorage.getItem('character-stats');
console.log('Character stats:', characterStats ? JSON.parse(characterStats) : 'NOT FOUND');

// Check onboarding state
const onboardingState = localStorage.getItem('onboarding-state');
console.log('Onboarding state:', onboardingState ? JSON.parse(onboardingState) : 'NOT FOUND');

// Check if data was cleared recently
const lastModified = localStorage.getItem('last-modified');
console.log('Last modified:', lastModified);

// Check for any error messages
console.log('Recent console errors (if any):');
// This would need to be checked manually in the console

console.log('=== END DIAGNOSTIC ==='); 