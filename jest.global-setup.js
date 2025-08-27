// Jest global setup file
// This runs once before all test suites

module.exports = async () => {
  // Set up global test environment
  process.env.NODE_ENV = 'test';
  
  // Set up any global test configurations
  global.testTimeout = 10000;
  
  console.log('🧪 Jest global setup completed');
};
