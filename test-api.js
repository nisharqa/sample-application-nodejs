#!/usr/bin/env node

/**
 * API Test Script for Sample Node.js Application
 * 
 * This script demonstrates how to call the vulnerable endpoints
 * to trigger the various security issues for CodeRabbit review
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Make HTTP request to API
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test_key_12345'
      }
    };

    const req = http.request(options, (res) => {
      let response = '';
      res.on('data', chunk => response += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(response)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: response
          });
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

/**
 * Test suite
 */
async function runTests() {
  log('bright', '\n=== CodeRabbit PoC - API Test Suite ===\n');

  try {
    // Test 1: Health check
    log('blue', '1. Testing Health Check...');
    const health = await makeRequest('GET', '/health');
    log('green', `   Status: ${health.status} ✓`);

    // Test 2: No input validation - Create user
    log('blue', '\n2. Testing No Input Validation (Create User)...');
    const createUser = await makeRequest('POST', '/api/user', {
      userId: 'user_123',
      email: 'test@example.com',
      age: 'invalid_age',
      name: "'; DROP TABLE users; --",
      phone: '+1234567890'
    });
    log('green', `   User created: ${createUser.status}`);
    log('yellow', `   Issue: Input accepted without validation`);

    // Test 3: Retrieve user
    log('blue', '\n3. Testing Get User...');
    const getUser = await makeRequest('GET', '/api/user/user_123');
    log('green', `   User retrieved: ${getUser.status}`);

    // Test 4: SQL Injection vulnerable search
    log('blue', '\n4. Testing SQL Injection Vulnerability...');
    const sqlInjection = await makeRequest('GET', "/api/search?q=admin' OR '1'='1&type=users");
    log('green', `   Search executed: ${sqlInjection.status}`);
    log('yellow', `   Issue: SQL injection possible - ${sqlInjection.body.query}`);

    // Test 5: Hardcoded credentials exposure
    log('blue', '\n5. Testing Database Connection (Hardcoded Credentials)...');
    const dbOp = await makeRequest('POST', '/api/db-operation', {});
    log('green', `   DB Operation response: ${dbOp.status}`);
    log('yellow', `   Issue: Credentials exposed in response`);
    log('red', `   Connection String: ${dbOp.body.connectionString}`);

    // Test 6: Blocking CPU loop
    log('blue', '\n6. Testing Blocking CPU Operation (this may take a moment)...');
    const startTime = Date.now();
    const compute = await makeRequest('GET', '/api/compute?iterations=100000000');
    const duration = Date.now() - startTime;
    log('green', `   Computation completed: ${compute.status} (${duration}ms)`);
    log('yellow', `   Issue: Blocking operation froze the API for ${duration}ms`);

    // Test 7: Hash endpoint (blocking crypto)
    log('blue', '\n7. Testing Blocking Hash Operation...');
    const startHash = Date.now();
    const hash = await makeRequest('POST', '/api/hash', {
      password: 'mypassword123',
      rounds: 50000
    });
    const hashDuration = Date.now() - startHash;
    log('green', `   Hash completed: ${hash.status} (${hashDuration}ms)`);
    log('yellow', `   Issue: Synchronous blocking crypto operation`);

    // Test 8: Log event - sensitive data exposure
    log('blue', '\n8. Testing Sensitive Data Logging...');
    const logEvent = await makeRequest('POST', '/api/log-event', {
      userId: 'user_123',
      action: 'login',
      data: { secret: 'sensitive_data' }
    });
    log('green', `   Event logged: ${logEvent.status}`);
    log('yellow', `   Issue: API key from headers also logged`);

    // Test 9: View logs - access all sensitive data
    log('blue', '\n9. Testing Logs Endpoint (Sensitive Data Exposure)...');
    const logs = await makeRequest('GET', '/api/logs?limit=5');
    log('green', `   Retrieved ${logs.body.logs.length} log entries`);
    log('yellow', `   Issue: All sensitive data including API keys exposed`);

    // Test 10: Path traversal vulnerability
    log('blue', '\n10. Testing Path Traversal Vulnerability...');
    const fileAccess = await makeRequest('GET', '/api/file/package.json');
    log('green', `   File access: ${fileAccess.status}`);
    log('yellow', `   Issue: No validation on file paths - ../../etc/passwd would work`);

    // Test 11: External API without error handling
    log('blue', '\n11. Testing Unhandled Promise Rejection...');
    const externalData = await makeRequest('GET', '/api/external-data?url=https://api.example.com');
    log('green', `   External API call: ${externalData.status}`);
    log('yellow', `   Issue: No error handling for failed external API calls`);

    // Test 12: List users
    log('blue', '\n12. Testing User Listing...');
    const userList = await makeRequest('GET', '/api/users?limit=10');
    log('green', `   Found ${userList.body.total} users`);
    log('yellow', `   Issue: No input validation on limit parameter`);

    log('bright', '\n=== Test Suite Complete ===\n');
    log('green', 'All vulnerability endpoints are working and can be reviewed by CodeRabbit!');

  } catch (error) {
    log('red', `Error: ${error.message}`);
    log('red', 'Make sure the server is running on port 3000');
    log('red', 'Start the server with: npm start');
  }
}

// Wait a moment for server to be ready, then run tests
setTimeout(runTests, 500);
