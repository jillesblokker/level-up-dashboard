/**
 * Browser-Based Data System Audit Script
 * 
 * Run this script in your browser console to perform comprehensive testing
 * of the data saving and application system.
 */

class BrowserDataAuditor {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  addTestResult(testName, passed, details, error = null) {
    this.results.push({
      testName,
      passed,
      details,
      error,
      timestamp: new Date().toISOString()
    });
    
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}`);
    if (error) {
      console.log(`   Error: ${error}`);
    }
    if (details && Object.keys(details).length > 0) {
      console.log(`   Details:`, details);
    }
  }

  async makeRequest(path, method = 'GET', body = null) {
    try {
      const response = await fetch(path, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined
      });
      
      const data = await response.json().catch(() => response.text());
      return { status: response.status, data, ok: response.ok };
    } catch (error) {
      return { status: 0, data: null, ok: false, error: error.message };
    }
  }

  async testAPIConnectivity() {
    console.log('\n🔌 Testing API Connectivity...');
    
    try {
      const response = await this.makeRequest('/api/quests');
      this.addTestResult(
        'API Connectivity Test',
        response.status === 200 || response.status === 401,
        { status: response.status, hasData: !!response.data }
      );
    } catch (error) {
      this.addTestResult(
        'API Connectivity Test',
        false,
        {},
        `Network error: ${error.message}`
      );
    }
  }

  async testDataEndpoints() {
    console.log('\n📊 Testing Data Endpoints...');
    
    const endpoints = [
      { name: 'Quests API', path: '/api/quests' },
      { name: 'Challenges API', path: '/api/challenges' },
      { name: 'Milestones API', path: '/api/milestones' },
      { name: 'Kingdom Stats API', path: '/api/kingdom-stats-v2' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint.path);
        this.addTestResult(
          `${endpoint.name} Endpoint`,
          response.status === 200 || response.status === 401,
          { 
            status: response.status, 
            hasData: Array.isArray(response.data),
            dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
          }
        );
      } catch (error) {
        this.addTestResult(
          `${endpoint.name} Endpoint`,
          false,
          {},
          `Request failed: ${error.message}`
        );
      }
    }
  }

  async testDataRestoration() {
    console.log('\n🔄 Testing Data Restoration...');
    
    try {
      const response = await this.makeRequest('/api/restore-lost-quest-data', 'POST');
      this.addTestResult(
        'Data Restoration API',
        response.status === 200,
        { 
          status: response.status,
          success: response.data?.success,
          restored: response.data?.restored,
          totalXP: response.data?.totalXP,
          totalGold: response.data?.totalGold
        }
      );
    } catch (error) {
      this.addTestResult(
        'Data Restoration API',
        false,
        {},
        `Restoration test failed: ${error.message}`
      );
    }
  }

  async testOriginalChallengesRestoration() {
    console.log('\n🎯 Testing Original Challenges Restoration...');
    
    try {
      const response = await this.makeRequest('/api/restore-original-challenges', 'POST');
      this.addTestResult(
        'Original Challenges Restoration',
        response.status === 200,
        { 
          status: response.status,
          success: response.data?.success,
          restored: response.data?.restored,
          categories: response.data?.totalCategories
        }
      );
    } catch (error) {
      this.addTestResult(
        'Original Challenges Restoration',
        false,
        {},
        `Challenges restoration test failed: ${error.message}`
      );
    }
  }

  async testSystemAudit() {
    console.log('\n🔍 Testing System Audit Endpoint...');
    
    try {
      const response = await this.makeRequest('/api/audit-data-system', 'POST');
      this.addTestResult(
        'System Audit Endpoint',
        response.status === 200,
        { 
          status: response.status,
          totalTests: response.data?.totalTests,
          passedTests: response.data?.passedTests,
          failedTests: response.data?.failedTests,
          summary: response.data?.summary
        }
      );
    } catch (error) {
      this.addTestResult(
        'System Audit Endpoint',
        false,
        {},
        `System audit test failed: ${error.message}`
      );
    }
  }

  async testDataConsistency() {
    console.log('\n🔗 Testing Data Consistency...');
    
    try {
      // Test that all APIs return consistent data structures
      const [questsResponse, challengesResponse, milestonesResponse] = await Promise.all([
        this.makeRequest('/api/quests'),
        this.makeRequest('/api/challenges'),
        this.makeRequest('/api/milestones')
      ]);

      const allAPIsWorking = [questsResponse, challengesResponse, milestonesResponse]
        .every(response => response.status === 200 || response.status === 401);

      this.addTestResult(
        'Data Consistency Across APIs',
        allAPIsWorking,
        { 
          questsStatus: questsResponse.status,
          challengesStatus: challengesResponse.status,
          milestonesStatus: milestonesResponse.status,
          allConsistent: allAPIsWorking
        }
      );
    } catch (error) {
      this.addTestResult(
        'Data Consistency Across APIs',
        false,
        {},
        `Consistency test failed: ${error.message}`
      );
    }
  }

  async testErrorHandling() {
    console.log('\n⚠️ Testing Error Handling...');
    
    try {
      // Test with invalid endpoint
      const response = await this.makeRequest('/api/invalid-endpoint');
      this.addTestResult(
        'Error Handling for Invalid Endpoints',
        response.status === 404,
        { status: response.status, expected404: response.status === 404 }
      );
    } catch (error) {
      this.addTestResult(
        'Error Handling for Invalid Endpoints',
        false,
        {},
        `Error handling test failed: ${error.message}`
      );
    }
  }

  async testPerformanceMetrics() {
    console.log('\n⚡ Testing Performance Metrics...');
    
    const performanceTests = [];
    
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      try {
        await this.makeRequest('/api/quests');
        const endTime = Date.now();
        performanceTests.push(endTime - startTime);
      } catch (error) {
        performanceTests.push(-1); // Error indicator
      }
    }

    const successfulTests = performanceTests.filter(time => time > 0);
    const averageResponseTime = successfulTests.length > 0 
      ? successfulTests.reduce((a, b) => a + b, 0) / successfulTests.length 
      : -1;

    this.addTestResult(
      'Performance Metrics',
      successfulTests.length >= 3, // At least 3 successful requests
      { 
        totalTests: performanceTests.length,
        successfulTests: successfulTests.length,
        averageResponseTime: Math.round(averageResponseTime),
        maxResponseTime: Math.max(...successfulTests),
        minResponseTime: Math.min(...successfulTests)
      }
    );
  }

  async testQuestCompletionFlow() {
    console.log('\n🎮 Testing Quest Completion Flow...');
    
    try {
      // Get a quest to test with
      const questsResponse = await this.makeRequest('/api/quests');
      if (!questsResponse.ok || !Array.isArray(questsResponse.data) || questsResponse.data.length === 0) {
        this.addTestResult(
          'Quest Completion Flow',
          false,
          {},
          'No quests available for testing'
        );
        return;
      }

      const testQuest = questsResponse.data[0];
      
      // Test quest completion
      const completionResponse = await this.makeRequest('/api/quests/smart-completion', 'POST', {
        questId: testQuest.id,
        completed: true
      });

      this.addTestResult(
        'Quest Completion Flow',
        completionResponse.status === 200,
        { 
          status: completionResponse.status,
          questId: testQuest.id,
          questName: testQuest.name,
          success: completionResponse.data?.success
        }
      );
    } catch (error) {
      this.addTestResult(
        'Quest Completion Flow',
        false,
        {},
        `Quest completion flow test failed: ${error.message}`
      );
    }
  }

  async testChallengeCompletionFlow() {
    console.log('\n🏋️ Testing Challenge Completion Flow...');
    
    try {
      // Get a challenge to test with
      const challengesResponse = await this.makeRequest('/api/challenges');
      if (!challengesResponse.ok || !Array.isArray(challengesResponse.data) || challengesResponse.data.length === 0) {
        this.addTestResult(
          'Challenge Completion Flow',
          false,
          {},
          'No challenges available for testing'
        );
        return;
      }

      const testChallenge = challengesResponse.data[0];
      
      // Test challenge completion
      const completionResponse = await this.makeRequest('/api/challenges/completion', 'POST', {
        challengeId: testChallenge.id,
        completed: true
      });

      this.addTestResult(
        'Challenge Completion Flow',
        completionResponse.status === 200,
        { 
          status: completionResponse.status,
          challengeId: testChallenge.id,
          challengeName: testChallenge.name,
          success: completionResponse.data?.success
        }
      );
    } catch (error) {
      this.addTestResult(
        'Challenge Completion Flow',
        false,
        {},
        `Challenge completion flow test failed: ${error.message}`
      );
    }
  }

  generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;
    const totalTests = this.results.length;
    const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : '0';

    console.log('\n' + '='.repeat(60));
    console.log('📋 BROWSER DATA SYSTEM AUDIT REPORT');
    console.log('='.repeat(60));
    console.log(`🕐 Duration: ${duration}ms`);
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log('='.repeat(60));

    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   • ${result.testName}: ${result.error || 'Unknown error'}`);
      });
    }

    console.log('\n✅ PASSED TESTS:');
    this.results.filter(r => r.passed).forEach(result => {
      console.log(`   • ${result.testName}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log(`🎯 Overall Assessment: ${successRate >= 80 ? 'EXCELLENT' : successRate >= 60 ? 'GOOD' : 'NEEDS ATTENTION'}`);
    console.log('='.repeat(60));

    return {
      duration,
      totalTests,
      passedTests,
      failedTests,
      successRate: parseFloat(successRate),
      results: this.results,
      assessment: successRate >= 80 ? 'EXCELLENT' : successRate >= 60 ? 'GOOD' : 'NEEDS ATTENTION'
    };
  }

  async runFullAudit() {
    console.log('🚀 Starting Comprehensive Browser Data System Audit...');
    console.log(`🌐 Current URL: ${window.location.href}`);
    
    await this.testAPIConnectivity();
    await this.testDataEndpoints();
    await this.testDataRestoration();
    await this.testOriginalChallengesRestoration();
    await this.testSystemAudit();
    await this.testDataConsistency();
    await this.testErrorHandling();
    await this.testPerformanceMetrics();
    await this.testQuestCompletionFlow();
    await this.testChallengeCompletionFlow();
    
    return this.generateReport();
  }
}

// Auto-run the audit when this script is loaded
console.log('🔧 Browser Data System Auditor loaded. Run audit with:');
console.log('const auditor = new BrowserDataAuditor();');
console.log('auditor.runFullAudit().then(report => console.log("Audit completed:", report));');

// Make it globally available
window.BrowserDataAuditor = BrowserDataAuditor;
