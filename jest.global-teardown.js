// Jest global teardown file
// This runs once after all test suites

module.exports = async () => {
  // Clean up global test environment
  delete global.testTimeout;
  
  // Clean up any global mocks or configurations
  if (global.testUtils) {
    delete global.testUtils;
  }
  
  console.log('🧹 Jest global teardown completed');
};
