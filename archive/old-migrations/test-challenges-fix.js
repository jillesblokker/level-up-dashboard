// Test script to verify challenges are working
// Run this in the browser console on the challenges page

console.log('=== CHALLENGES TEST ===');

// Test 1: Check if challenges are loaded
const challengesElement = document.querySelector('[aria-label*="challenge"]');
console.log('1. Challenge elements found:', !!challengesElement);

// Test 2: Check if challenges data is available
if (window.challenges) {
  console.log('2. Challenges data available:', window.challenges.length);
  console.log('   Sample challenge:', window.challenges[0]);
} else {
  console.log('2. Challenges data not available in window object');
}

// Test 3: Check if challenge toggle buttons work
const toggleButtons = document.querySelectorAll('[data-quest-id]');
console.log('3. Toggle buttons found:', toggleButtons.length);

// Test 4: Check if categories are displayed
const categoryElements = document.querySelectorAll('[data-category]');
console.log('4. Category elements found:', categoryElements.length);

// Test 5: Check if challenges are filtered by category
const challengeCards = document.querySelectorAll('[aria-label*="Quest card"]');
console.log('5. Challenge cards found:', challengeCards.length);

console.log('=== END TEST ===');
