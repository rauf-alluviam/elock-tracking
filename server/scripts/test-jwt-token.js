// Simple JWT token decoder and tester
// This script helps debug JWT token issues

import jwt from 'jsonwebtoken';

// The token from your error logs
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZV9jb2RlX25vIjoiODEyMDIzNzczIiwiaWF0IjoxNzUyMTI2NDgyLCJleHAiOjE3NTIxMjcwODJ9.cFkV9zm11GmwjGNF3DK0qAnbd93Q04rcVGNvcD2xs6E';

// Common secrets to try
const commonSecrets = [
  'your_jwt_secret_key_here',
  'secret',
  'secretkey',
  'jwt_secret',
  'mysecretkey',
  'elock_secret',
  'default_secret',
  'EXIM_SSO_SECRET',
  'test_secret_123',
  // Additional patterns
  'sso_secret',
  'SSO_SECRET',
  'exim_sso_secret',
  'ELOCK_JWT_SECRET',
  'shared_secret',
  'SHARED_SECRET',
  '812023773', // Sometimes IE code is used
  'elock_tracking_secret',
  'ELOCK_TRACKING_SECRET',
  'alvision_secret',
  'ALVISION_SECRET',
  'client_secret',
  'CLIENT_SECRET',
  // Pattern-based secrets
  'secret123',
  'Secret123',
  'SECRET123',
  'elock123',
  'ELOCK123',
  'jwt123',
  'JWT123',
  // Base64-like patterns
  'c2VjcmV0', // 'secret' in base64
  'ZWxvY2s=', // 'elock' in base64
  // Common production patterns
  'prod_secret',
  'dev_secret',
  'test_secret',
  'staging_secret'
];

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

// Try different secrets
for (const secret of commonSecrets) {
  try {
    const decoded = jwt.verify(testToken, secret);
    console.log(`✅ SUCCESS with secret: "${secret}"`);
    console.log('📋 Decoded payload:', JSON.stringify(decoded, null, 2));
    console.log('\n🎯 Use this secret in your .env file:');
    console.log(`JWT_SECRET=${secret}`);
    break;
  } catch (error) {
    console.log(`❌ Failed with secret: "${secret}" - ${error.message}`);
  }
}

console.log('\n💡 If none of these work, you need to find out what secret was used to generate the token.');
console.log('💡 Contact your SSO provider or check their documentation for the signing secret.');
