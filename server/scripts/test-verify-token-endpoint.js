// Test script for verify-token endpoint with comprehensive HTTP authentication testing
import axios from 'axios';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// The token from previous tests (updated token)
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODM4MGQxYjc4MzQ2ZjA2MzU2NDNjOTgiLCJpZV9jb2RlX25vIjoiODEyMDIzNzczIiwibmFtZSI6IkcuUi5NRVRBTExPWVMgUFJJVkFURSBMSU1JVEVEIiwiaWF0IjoxNzUyMTI4MjkyLCJleHAiOjE3NTIxMjg4OTJ9.u5YvvedYXcF_386GP5pkepgcJO7TYtj6bYcpsxlu188';

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

print.header('E-LOCK SSO TOKEN VERIFICATION TEST');

// Decode the token to inspect payload
print.info('📋 Decoding token to inspect payload:');
const decodedToken = jwt.decode(testToken);
console.log(JSON.stringify(decodedToken, null, 2));
console.log('\n');

// Check JWT secret in environment
print.info('🔑 Checking JWT secret in environment:');
if (process.env.JWT_SECRET) {
  console.log(`- JWT_SECRET is defined (${process.env.JWT_SECRET.length} characters)`);
  
  // Check for potential issues with the secret
  if (/^\s|\s$/.test(process.env.JWT_SECRET)) {
    print.warning('JWT_SECRET has leading or trailing whitespace!');
  }
  if (process.env.JWT_SECRET.includes('\n')) {
    print.warning('JWT_SECRET contains newline characters!');
  }
  
  // Try to locally verify the token
  try {
    const jwtSecret = process.env.JWT_SECRET.trim();
    jwt.verify(testToken, jwtSecret);
    print.success('Token can be verified locally with current JWT_SECRET');
  } catch (error) {
    print.error(`Local token verification failed: ${error.message}`);
    print.warning('This suggests a mismatch between the token and the secret in .env');
  }
} else {
  print.error('JWT_SECRET is not defined in environment!');
}
console.log('\n');

// Ports to try
const ports = [5003, 3005];

async function testVerifyTokenEndpoint() {
  print.header('TESTING /api/auth/verify-token ENDPOINT');
  
  let response = null;
  
  // Try each port in sequence
  for (const port of ports) {
    const apiUrl = `http://localhost:${port}/api/auth/verify-token`;
    print.info(`🔄 Trying endpoint: ${apiUrl}`);
    
    try {
      response = await axios.post(apiUrl, {
        token: testToken
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      print.success(`Request to port ${port} succeeded!`);
      break; // Stop trying if successful
    } catch (error) {
      print.error(`Failed with port ${port}: ${error.message}`);
      
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      
      // Continue to next port
      continue;
    }
  }
    
  if (response) {
    print.success('Endpoint test successful!');
    console.log('Status code:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    // Check if the response contains expected fields
    if (response.data?.success && response.data?.user?.ieCodeNo) {
      print.success('Response contains expected user data!');
      console.log(`IE Code: ${response.data.user.ieCodeNo}`);
    } else {
      print.warning('Response doesn\'t contain expected user data structure');
    }
  } else {
    print.error('All endpoint tests failed. Server might not be running or is not accessible.');
  }
  
  return response;
}

// Generate a new token with our secret for testing
function generateTestToken() {
  print.header('GENERATING TEST TOKEN');
  
  if (!process.env.JWT_SECRET) {
    print.error('Cannot generate token: JWT_SECRET not found in environment');
    return null;
  }
  
  try {
    // Use the same payload but with fresh timestamps
    const payload = {
      sub: decodedToken.sub,
      ie_code_no: decodedToken.ie_code_no,
      name: decodedToken.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 10) // 10 minutes
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET.trim());
    print.success('Token generated successfully!');
    console.log('New token:', token);
    
    // Print test URL
    print.info('Test URL for E-Lock system:');
    console.log(`http://localhost:3005/?token=${token}`);
    
    return token;
  } catch (error) {
    print.error(`Error generating token: ${error.message}`);
    return null;
  }
}

// Run complete test suite
async function runCompleteSuite() {
  // First test with the original token
  const verifyResponse = await testVerifyTokenEndpoint();
  
  // Then generate our own token
  const newToken = generateTestToken();
  
  // Print summary
  print.header('TEST SUMMARY');
  console.log('- JWT secret validated: ' + (process.env.JWT_SECRET ? '✅' : '❌'));
  console.log('- Original token verification: ' + (verifyResponse ? '✅' : '❌'));
  console.log('- New token generation: ' + (newToken ? '✅' : '❌'));
  
  if (newToken) {
    console.log('\nUse this token for further testing:');
    console.log(newToken);
    console.log('\nUse this URL to test the E-Lock system:');
    console.log(`http://localhost:3005/?token=${newToken}`);
  }
}

// Run the test function
runCompleteSuite().catch(error => {
  print.error(`Unhandled error: ${error.message}`);
  console.error(error);
});
