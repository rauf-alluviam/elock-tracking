// JWT Token Debugger for E-Lock SSO
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// The token from URL
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODM4MGQxYjc4MzQ2ZjA2MzU2NDNjOTgiLCJpZV9jb2RlX25vIjoiODEyMDIzNzczIiwibmFtZSI6IkcuUi5NRVRBTExPWVMgUFJJVkFURSBMSU1JVEVEIiwiaWF0IjoxNzUyMTI3NTMyLCJleHAiOjE3NTIxMjgxMzJ9.xUmu3U6uAqfUnoemcTzSUKX64wNL4-v1XVek4gGKZIs';

console.log('🔍 JWT Token Debug Tool\n');

// Display environment info
console.log('🛠 Environment:');
console.log(`- JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Defined' : '❌ Not defined'}`);
console.log(`- SSO_ENABLED: ${process.env.SSO_ENABLED || '❌ Not defined'}`);
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log('');

// Decode without verification first
try {
  const decoded = jwt.decode(testToken, { complete: true });
  console.log('📋 Token Header:', JSON.stringify(decoded.header, null, 2));
  console.log('📋 Token Payload:', JSON.stringify(decoded.payload, null, 2));
  console.log('');
} catch (error) {
  console.error('❌ Failed to decode token:', error.message);
}

// Attempt brute force approach to find the secret
console.log('🔐 Attempting to find the correct secret...\n');

// Check .env file directly
try {
  const envPath = path.resolve(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  console.log('📋 Reading .env file...');
  
  // Extract JWT_SECRET values with regular expression
  const secretMatches = envContent.match(/JWT_SECRET=(.+)$/mg);
  
  if (secretMatches && secretMatches.length > 0) {
    console.log(`Found ${secretMatches.length} JWT_SECRET entries in .env file:\n`);
    
    for (let i = 0; i < secretMatches.length; i++) {
      const secretLine = secretMatches[i];
      const secret = secretLine.split('=')[1].trim();
      
      console.log(`Testing secret #${i + 1}: ${secret.substring(0, 10)}...`);
      
      try {
        const decoded = jwt.verify(testToken, secret);
        console.log(`✅ SUCCESS with secret #${i + 1}!`);
        console.log('📋 Decoded payload:', JSON.stringify(decoded, null, 2));
        console.log(`\n🎯 Use this secret in your application: ${secret}`);
        
        // Exit the loop if successful
        break;
      } catch (error) {
        console.log(`❌ Failed with secret #${i + 1}: ${error.message}`);
      }
    }
  } else {
    console.log('❌ No JWT_SECRET entries found in .env file');
  }
} catch (error) {
  console.error('❌ Error reading .env file:', error.message);
}

// Try with some standard test values
console.log('\n🔄 Trying with some standard test values...');

const testSecrets = [
  '3c7c6bab80b4ca6f1980fe6c99ca20e6265ea2ed27b83fc355ab30bee18030ad',
  'your_jwt_secret_key_here',
  'EXIM_SSO_SECRET',
  'secret',
  'test',
  '812023773', // IE code
  'elock_secret'
];

for (const secret of testSecrets) {
  try {
    console.log(`Testing: "${secret.substring(0, 10)}..."`);
    const decoded = jwt.verify(testToken, secret);
    console.log(`✅ SUCCESS with secret: "${secret}"`);
    console.log('📋 Decoded payload:', JSON.stringify(decoded, null, 2));
    break;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }
}

// Generate a new token we can use for testing
console.log('\n🔄 Generating new test token with known secret:');

const testSecret = 'elock_test_secret_123';
const payload = {
  sub: "68380d1b78346f06356543c98",
  ie_code_no: "812023773",
  name: "G.R.METALLOYS PRIVATE LIMITED",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 10)
};

try {
  const newToken = jwt.sign(payload, testSecret);
  
  console.log('✅ Test token generated!');
  console.log(newToken);
  
  console.log('\n📝 Update your .env file with:');
  console.log(`JWT_SECRET=${testSecret}`);
  
  console.log('\n🔗 Test with this URL:');
  console.log(`http://localhost:3005/?token=${newToken}`);
} catch (error) {
  console.error('❌ Error generating test token:', error);
}
