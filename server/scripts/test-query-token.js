// Test script for token as URL query parameter
import axios from 'axios';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Color helpers for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Print colored text
const print = {
  info: (text) => console.log(`${colors.blue}${text}${colors.reset}`),
  success: (text) => console.log(`${colors.green}✅ ${text}${colors.reset}`),
  error: (text) => console.log(`${colors.red}❌ ${text}${colors.reset}`),
  warning: (text) => console.log(`${colors.yellow}⚠️ ${text}${colors.reset}`),
  header: (text) => console.log(`\n${colors.magenta}${text}${colors.reset}\n${'='.repeat(text.length)}\n`)
};

// Generate a test token for use with URL query parameters
function generateTestToken() {
  // Create test payload
  const payload = {
    sub: "test-user-id",
    ie_code_no: "TEST123456",
    name: "TEST USER",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 10) // 10 minutes
  };
  
  // Sign with JWT_SECRET from .env
  const jwtSecret = process.env.JWT_SECRET ? process.env.JWT_SECRET.trim() : '';
  if (!jwtSecret) {
    print.error('JWT_SECRET not found in environment variables!');
    process.exit(1);
  }
  
  const token = jwt.sign(payload, jwtSecret);
  return token;
}

// Test accessing protected endpoint with token as query parameter
async function testQueryParameterToken() {
  print.header('TESTING TOKEN AS QUERY PARAMETER');
  
  // Generate test token
  const token = generateTestToken();
  print.info(`Generated test token: ${token.substring(0, 20)}...`);
  
  // Test URLs
  const urls = [
    `http://localhost:5004/api/elock/assignments?token=${token}`,
    `http://localhost:3005/api/elock/assignments?token=${token}`
  ];
  
  // Try each URL
  for (const url of urls) {
    try {
      print.info(`Testing URL: ${url}`);
      const response = await axios.get(url);
      
      if (response.data && response.status === 200) {
        print.success(`Request successful! Status: ${response.status}`);
        console.log('Response data:', JSON.stringify(response.data, null, 2).substring(0, 300) + '...');
        break; // Stop on first success
      }
    } catch (error) {
      print.error(`Request failed: ${error.message}`);
      
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
  }
}

// Test the /api/auth/me endpoint with token as query parameter
async function testMeEndpoint() {
  print.header('TESTING /api/auth/me WITH QUERY PARAMETER TOKEN');
  
  // Generate test token
  const token = generateTestToken();
  
  // Test URLs
  const urls = [
    `http://localhost:5004/api/auth/me?token=${token}`,
    `http://localhost:3005/api/auth/me?token=${token}`
  ];
  
  // Try each URL
  for (const url of urls) {
    try {
      print.info(`Testing URL: ${url}`);
      const response = await axios.get(url);
      
      if (response.data && response.status === 200) {
        print.success(`Request successful! Status: ${response.status}`);
        console.log('User data:', JSON.stringify(response.data, null, 2));
        break; // Stop on first success
      }
    } catch (error) {
      print.error(`Request failed: ${error.message}`);
      
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
  }
}

// Run tests
async function runTests() {
  print.header('E-LOCK SSO URL QUERY TOKEN TESTS');
  
  try {
    // Test accessing protected endpoint with token as query parameter
    await testQueryParameterToken();
    
    // Test the /api/auth/me endpoint with token as query parameter
    await testMeEndpoint();
    
    print.success('All tests completed!');
    
    // Generate a URL for direct browser testing
    const token = generateTestToken();
    print.header('TEST LINKS FOR BROWSER');
    console.log(`Direct API access: http://localhost:5004/api/auth/me?token=${token}`);
    console.log(`Client app with token: http://localhost:3005/?token=${token}`);
    
  } catch (error) {
    print.error(`Test suite error: ${error.message}`);
    console.error(error);
  }
}

runTests();
