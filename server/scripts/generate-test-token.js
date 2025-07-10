// JWT Token Generator for Testing
// This script generates a test token with a known secret

import jwt from 'jsonwebtoken';

// Let's use a simple, known secret for testing
const TEST_SECRET = 'elock_test_secret_123';

// Create a test token with the same structure
const payload = {
  ie_code_no: '812023773',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 10) // 10 minutes from now
};

try {
  const token = jwt.sign(payload, TEST_SECRET);
  
  console.log('✅ Generated Test Token:');
  console.log(token);
  console.log('');
  
  console.log('🔑 Secret used:', TEST_SECRET);
  console.log('');
  
  console.log('📋 Payload:', JSON.stringify(payload, null, 2));
  console.log('');
  
  // Verify it works
  const decoded = jwt.verify(token, TEST_SECRET);
  console.log('✅ Token verification successful!');
  console.log('📋 Decoded:', JSON.stringify(decoded, null, 2));
  console.log('');
  
  console.log('🎯 Add this to your .env file:');
  console.log(`JWT_SECRET=${TEST_SECRET}`);
  console.log('');
  
  console.log('🔗 Test URL:');
  console.log(`http://localhost:3005/?token=${token}`);
  
} catch (error) {
  console.error('❌ Error generating token:', error);
}
