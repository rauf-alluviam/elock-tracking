// JWT Token Verification Test for SSO Token
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// The token from URL (corrected format)
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODM4MGQxYjc4MzQ2ZjA2MzU2NDNjOTgiLCJpZV9jb2RlX25vIjoiODEyMDIzNzczIiwibmFtZSI6IkcuUi5NRVRBTExPWVMgUFJJVkFURSBMSU1JVEVEIiwiaWF0IjoxNzUyMTI4MjkyLCJleHAiOjE3NTIxMjg4OTJ9.u5YvvedYXcF_386GP5pkepgcJO7TYtj6bYcpsxlu188';

console.log('🔍 Testing JWT Token Verification...\n');

// Decode without verification first to see the payload
try {
  const decoded = jwt.decode(testToken, { complete: true });
  console.log('📋 Token Header:', JSON.stringify(decoded.header, null, 2));
  console.log('📋 Token Payload:', JSON.stringify(decoded.payload, null, 2));
  console.log('');
} catch (error) {
  console.error('❌ Failed to decode token:', error.message);
}

// Try with the secret from .env
try {
  console.log(`🔑 Using secret from .env: "${process.env.JWT_SECRET}"`);
  const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
  console.log('✅ SUCCESS! Token verified correctly');
  console.log('📋 Decoded payload:', JSON.stringify(decoded, null, 2));
} catch (error) {
  console.log(`❌ Failed with .env secret: ${error.message}`);
}

// Generate a new token with the same payload
try {
  // Extract payload from the token
  const payload = jwt.decode(testToken);
  
  // Create a new token with our secret
  const newToken = jwt.sign(payload, process.env.JWT_SECRET);
  
  console.log('\n🔄 Generated new token with our secret:');
  console.log(newToken);
  
  console.log('\n🔗 Test with this URL:');
  console.log(`http://localhost:3005/?token=${newToken}`);
} catch (error) {
  console.error('\n❌ Error generating new token:', error);
}
