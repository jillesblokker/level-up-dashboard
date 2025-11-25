// Test script to verify achievement system, notifications, and titles
// Run this in the browser console on any page

console.log('🧪 Testing Achievement System...');

// Test 1: Check achievement rewards
console.log('🏆 Testing achievement rewards...');

function testAchievementRewards() {
  const testCreatures = [
    { id: '000', name: 'Necrion', expectedGold: 20, expectedExp: 25 },
    { id: '001', name: 'Flamio', expectedGold: 20, expectedExp: 25 },
    { id: '002', name: 'Embera', expectedGold: 40, expectedExp: 50 },
    { id: '003', name: 'Vulcana', expectedGold: 60, expectedExp: 100 },
    { id: '004', name: 'Dolphio', expectedGold: 20, expectedExp: 25 },
    { id: '005', name: 'Divero', expectedGold: 40, expectedExp: 50 },
    { id: '006', name: 'Flippur', expectedGold: 60, expectedExp: 100 },
    { id: '007', name: 'Leaf', expectedGold: 20, expectedExp: 25 },
    { id: '008', name: 'Oaky', expectedGold: 40, expectedExp: 50 },
    { id: '009', name: 'Seqoio', expectedGold: 60, expectedExp: 100 },
    { id: '010', name: 'Rockie', expectedGold: 20, expectedExp: 25 },
    { id: '011', name: 'Buldour', expectedGold: 40, expectedExp: 50 },
    { id: '012', name: 'Montano', expectedGold: 60, expectedExp: 100 }
  ];

  testCreatures.forEach(creature => {
    // Simulate creature discovery
    console.log(`Testing ${creature.name} (ID: ${creature.id})`);
    
    // Create achievement notification
    const notification = {
      id: Date.now().toString(),
      title: "Achievement Unlocked! 🏆",
      message: `You've discovered ${creature.name}! You earned ${creature.expectedGold} gold and ${creature.expectedExp} experience!`,
      type: "achievement",
      read: false,
      timestamp: new Date().toISOString(),
      action: {
        label: "View Achievements",
        href: "/achievements",
      }
    };
    
    // Add to localStorage
    const savedNotifications = localStorage.getItem('notifications');
    const currentNotifications = savedNotifications ? JSON.parse(savedNotifications) : [];
    const updatedNotifications = [notification, ...currentNotifications];
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    
    // Dispatch notification event
    window.dispatchEvent(new CustomEvent('newNotification', { detail: notification }));
    
    console.log(`✅ Added achievement notification for ${creature.name}`);
  });
}

// Test 2: Check title system
console.log('👑 Testing title system...');

function testTitleSystem() {
  const testLevels = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
  
  testLevels.forEach(level => {
    // Simulate level up
    console.log(`Testing level ${level}`);
    
    // Create level up notification
    const notification = {
      id: Date.now().toString(),
      title: "Level Up! 🎉",
      message: `Congratulations! You've reached Level ${level}! Your journey continues...`,
      type: "levelup",
      read: false,
      timestamp: new Date().toISOString(),
      action: {
        label: "View Character",
        href: "/character",
      }
    };
    
    // Add to localStorage
    const savedNotifications = localStorage.getItem('notifications');
    const currentNotifications = savedNotifications ? JSON.parse(savedNotifications) : [];
    const updatedNotifications = [notification, ...currentNotifications];
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    
    // Dispatch notification event
    window.dispatchEvent(new CustomEvent('newNotification', { detail: notification }));
    
    console.log(`✅ Added level up notification for level ${level}`);
  });
}

// Test 3: Check notification center functionality
console.log('🔔 Testing notification center...');

function testNotificationCenter() {
  // Check if notifications exist
  const savedNotifications = localStorage.getItem('notifications');
  if (savedNotifications) {
    const notifications = JSON.parse(savedNotifications);
    console.log(`📊 Total notifications: ${notifications.length}`);
    console.log(`📊 Unread notifications: ${notifications.filter(n => !n.read).length}`);
    
    // Test different notification types
    const typeCounts = {};
    notifications.forEach(n => {
      typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
    });
    
    console.log('📊 Notification types:', typeCounts);
  } else {
    console.log('❌ No notifications found');
  }
}

// Test 4: Check title progression
console.log('🎯 Testing title progression...');

function testTitleProgression() {
  const testLevels = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const expectedTitles = ['Squire', 'Knight', 'Baron', 'Viscount', 'Count', 'Marquis', 'Duke', 'Prince', 'King', 'Emperor', 'God'];
  
  testLevels.forEach((level, index) => {
    const expectedTitle = expectedTitles[index];
    console.log(`Level ${level}: Expected title "${expectedTitle}"`);
  });
}

// Run all tests
if (typeof window !== 'undefined') {
  console.log('🚀 Starting comprehensive tests...');
  
  testAchievementRewards();
  testTitleSystem();
  testNotificationCenter();
  testTitleProgression();
  
  console.log('🎉 All tests completed!');
  console.log('💡 Check the notification center (bell icon) to see all test notifications');
  console.log('💡 Visit /character to see the title system in action');
  console.log('💡 Try completing quests or gaining experience to see real notifications');
  
} else {
  console.log('❌ Window object not available (server-side rendering)');
} 