// Check environment variables
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Environment Variables Check:\n');

// Check for JWT_SECRET
console.log('JWT_SECRET:', process.env.JWT_SECRET || '❌ Not defined');
console.log('SSO_ENABLED:', process.env.SSO_ENABLED || '❌ Not defined');
console.log('LOGIN_REDIRECT_URL:', process.env.LOGIN_REDIRECT_URL || '❌ Not defined');
console.log('CLIENT_URL:', process.env.CLIENT_URL || '❌ Not defined');
