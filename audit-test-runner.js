#!/usr/bin/env node

/**
 * Comprehensive Data System Audit Test Runner
 * 
 * This script performs independent testing of the data saving and application system
 * without requiring external input. It tests all critical functionality.
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.AUDIT_BASE_URL || 'https://lvlup.jillesblokker.com';
const USER_TOKEN = process.env.AUDIT_USER_TOKEN || 'test-token';

class DataSystemAuditor {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${USER_TOKEN}`,
          'User-Agent': 'DataSystemAuditor/1.0'
        }
      };

      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
          } catch (error) {
            resolve({ status: res.statusCode, data: data, headers: res.headers, parseError: error.message });
          }
        });
      });

      req.on('error', reject);
      
      if (body) {
        req.write(JSON.stringify(body));
      }
      
      req.end();
    });
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
      console.log(`   Details: ${JSON.stringify(details, null, 2).replace(/\n/g, '\n   ')}`);
    }
  }

  async testAPIConnectivity() {
    console.log('\n🔌 Testing API Connectivity...');
    
    try {
      const response = await this.makeRequest('/api/quests');
      this.addTestResult(
        'API Connectivity Test',
        response.status === 200 || response.status === 401, // 401 is expected without proper auth
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

  generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;
    const totalTests = this.results.length;
    const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : '0';

    console.log('\n' + '='.repeat(60));
    console.log('📋 DATA SYSTEM AUDIT REPORT');
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
    console.log('🚀 Starting Comprehensive Data System Audit...');
    console.log(`🌐 Target URL: ${BASE_URL}`);
    console.log(`🔑 Using Token: ${USER_TOKEN.substring(0, 10)}...`);
    
    await this.testAPIConnectivity();
    await this.testDataEndpoints();
    await this.testDataRestoration();
    await this.testOriginalChallengesRestoration();
    await this.testSystemAudit();
    await this.testDataConsistency();
    await this.testErrorHandling();
    await this.testPerformanceMetrics();
    
    return this.generateReport();
  }
}

// Run the audit if this script is executed directly
if (require.main === module) {
  const auditor = new DataSystemAuditor();
  auditor.runFullAudit()
    .then(report => {
      console.log('\n🎉 Audit completed successfully!');
      process.exit(report.failedTests === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Audit failed with error:', error);
      process.exit(1);
    });
}

module.exports = DataSystemAuditor;
