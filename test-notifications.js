// Test script to verify notification system is working
// Run this in the browser console on any page

console.log('🧪 Testing Notification System...');

// Test 1: Check if notification service is available
console.log('📊 Checking notification service...');
if (typeof window !== 'undefined') {
  // Check if notifications exist in localStorage
  const savedNotifications = localStorage.getItem('notifications');
  console.log('Saved notifications:', savedNotifications);
  
  if (savedNotifications) {
    const notifications = JSON.parse(savedNotifications);
    console.log('Current notifications:', notifications);
    console.log('✅ Notifications found in localStorage');
  } else {
    console.log('❌ No notifications found in localStorage');
  }
  
  // Test 2: Simulate experience gained notification
  console.log('⭐ Testing experience gained notification...');
  
  // Simulate gaining experience
  const testExpAmount = 25;
  const testSource = 'test-quest';
  
  // Create a test notification manually
  const testNotification = {
    id: Date.now().toString(),
    title: "Experience Gained! ⭐",
    message: `You gained ${testExpAmount} experience from ${testSource}! Total: +${testExpAmount} XP`,
    type: "success",
    read: false,
    timestamp: new Date().toISOString(),
    action: {
      label: "View Progress",
      href: "/character",
    }
  };
  
  // Add to localStorage
  const currentNotifications = savedNotifications ? JSON.parse(savedNotifications) : [];
  const updatedNotifications = [testNotification, ...currentNotifications];
  localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  
  // Dispatch notification event
  window.dispatchEvent(new CustomEvent('newNotification', { detail: testNotification }));
  
  console.log('✅ Test experience notification added');
  console.log('💡 Check the notification center (bell icon) to see the notification');
  
  // Test 3: Simulate gold gained notification
  console.log('💰 Testing gold gained notification...');
  
  const testGoldAmount = 50;
  const testGoldSource = 'test-quest';
  
  const testGoldNotification = {
    id: (Date.now() + 1).toString(),
    title: "Gold Gained! 💰",
    message: `You earned ${testGoldAmount} gold from ${testGoldSource}!`,
    type: "success",
    read: false,
    timestamp: new Date().toISOString(),
    action: {
      label: "View Treasury",
      href: "/treasury",
    }
  };
  
  // Add to localStorage
  const updatedNotificationsWithGold = [testGoldNotification, ...updatedNotifications];
  localStorage.setItem('notifications', JSON.stringify(updatedNotificationsWithGold));
  
  // Dispatch notification event
  window.dispatchEvent(new CustomEvent('newNotification', { detail: testGoldNotification }));
  
  console.log('✅ Test gold notification added');
  
  // Test 4: Simulate level up notification
  console.log('🎉 Testing level up notification...');
  
  const testLevelUpNotification = {
    id: (Date.now() + 2).toString(),
    title: "Level Up! 🎉",
    message: "Congratulations! You've reached Level 2! Your journey continues...",
    type: "levelup",
    read: false,
    timestamp: new Date().toISOString(),
    action: {
      label: "View Character",
      href: "/character",
    }
  };
  
  // Add to localStorage
  const finalNotifications = [testLevelUpNotification, ...updatedNotificationsWithGold];
  localStorage.setItem('notifications', JSON.stringify(finalNotifications));
  
  // Dispatch notification event
  window.dispatchEvent(new CustomEvent('newNotification', { detail: testLevelUpNotification }));
  
  console.log('✅ Test level up notification added');
  
  // Test 5: Check notification count
  const unreadCount = finalNotifications.filter(n => !n.read).length;
  console.log(`📊 Total notifications: ${finalNotifications.length}`);
  console.log(`📊 Unread notifications: ${unreadCount}`);
  
  console.log('🎉 Notification system test completed!');
  console.log('💡 Check the notification center (bell icon) to see all test notifications');
  console.log('💡 Try completing a quest to see real notifications in action');
  
} else {
  console.log('❌ Window object not available (server-side rendering)');
} 