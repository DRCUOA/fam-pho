/**
 * Integration Test Script
 * 
 * Run this with: node tests/integration-test.js
 * 
 * Tests the full workflow: Login → Upload → Triage → Search
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'admin@example.com';
const TEST_PASSWORD = 'admin123';

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Helper to extract cookies from headers
function getCookies(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  return setCookie.map(cookie => cookie.split(';')[0]).join('; ');
}

let sessionCookie = '';

async function test(name, testFn) {
  try {
    const result = await testFn();
    if (result.passed) {
      console.log(`✅ ${name}`);
      return true;
    } else {
      console.log(`❌ ${name}: ${result.error || 'Test failed'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting Integration Tests...\n');
  console.log('ℹ️  Note: If search test fails with "Photo ID required", restart the server to apply route order fix.\n');
  
  const results = [];
  
  // Test 1: Health Check
  results.push(await test('Health check endpoint', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET'
    });
    return { passed: response.status === 200 };
  }));
  
  // Test 2: Login
  results.push(await test('Login with valid credentials', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    sessionCookie = getCookies(response.headers);
    return { 
      passed: response.status === 200 && sessionCookie.length > 0,
      error: response.status !== 200 ? `Status: ${response.status}` : null
    };
  }));
  
  // Test 3: Get Current User (includes libraries)
  let libraries = null;
  results.push(await test('Get current user (authenticated)', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    if (response.status === 200 && response.body.user && response.body.libraries) {
      libraries = response.body.libraries;
    }
    
    return { 
      passed: response.status === 200 && response.body.user && Array.isArray(response.body.libraries),
      error: response.status !== 200 ? `Status: ${response.status}` : null
    };
  }));
  
  // Test 4: Verify Libraries Data
  results.push(await test('Libraries data structure', async () => {
    return { 
      passed: libraries !== null && libraries.length > 0 && libraries[0].id,
      error: libraries === null ? 'Libraries not found in /api/auth/me response' : null
    };
  }));
  
  // Test 5: Get Workflow Queues
  results.push(await test('Get workflow queues', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/workflow/next-tasks?library_id=1',
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    return { 
      passed: response.status === 200 && response.body.queues,
      error: response.status !== 200 ? `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` : null
    };
  }));
  
  // Test 6: Search (empty)
  results.push(await test('Search endpoint (empty query)', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/photos/search?library_id=1&q=',
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    // If we get "Photo ID required", it means the route matched /photos/:id instead of /photos/search
    // This indicates the server needs to be restarted after route order changes
    if (response.status === 400 && response.body.error === 'Photo ID required') {
      return {
        passed: false,
        error: `Route conflict: /api/photos/search matched /photos/:id. Restart server to apply route order fix.`
      };
    }
    
    return { 
      passed: response.status === 200 && Array.isArray(response.body.photos),
      error: response.status !== 200 ? `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` : null
    };
  }));
  
  // Test 7: Invalid Login
  // Note: If rate limited (429), the test will fail - this is expected behavior
  // Rate limiting can occur on any login attempt (valid or invalid) after too many requests
  results.push(await test('Login with invalid credentials (should fail)', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    });
    
    if (response.status === 429) {
      return {
        passed: false,
        error: `Rate limited (429). Too many login attempts. Wait 15 minutes or restart server to reset rate limit.`
      };
    }
    
    return { 
      passed: response.status === 401,
      error: response.status !== 401 ? `Expected 401 for invalid credentials, got ${response.status}` : null
    };
  }));
  
  // Test 8: Protected route without auth
  results.push(await test('Access protected route without auth (should fail)', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/photos/triage?library_id=1',
      method: 'GET'
    });
    
    return { 
      passed: response.status === 401 || response.status === 403,
      error: response.status < 400 ? `Expected 401/403, got ${response.status}` : null
    };
  }));
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n📊 Test Results: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️ Some tests failed');
    process.exit(1);
  }
}

// Check if server is running
makeRequest({
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET'
}).then(() => {
  runTests();
}).catch((error) => {
  console.error('❌ Cannot connect to server. Make sure it\'s running on http://localhost:3000');
  console.error('   Start with: npm start');
  process.exit(1);
});
