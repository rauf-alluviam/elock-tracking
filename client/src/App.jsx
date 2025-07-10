import React, { useEffect, useState } from 'react'
import Dashboard from './components/Dashboard'
import { apiService } from './services/api'

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  useEffect(() => {
    const processSsoAuthentication = async () => {
      try {
        setIsLoading(true);
        console.log('🔍 Checking for SSO token...');
        
        // First check if we have a token in the URL
        const urlToken = apiService.getTokenFromUrl();
        if (urlToken) {
          console.log('✅ Found token in URL, verifying...');
        } else {
          console.log('⚠️ No token in URL, checking storage...');
        }
        
        // Process the SSO token from URL or storage
        const result = await apiService.processSsoToken(true); // true = redirect on failure
        
        if (result.success) {
          console.log('✅ Authentication successful!');
        } else {
          console.error('❌ Authentication failed:', result.error);
          setAuthError(result.error || 'Authentication failed');
        }
      } catch (error) {
        console.error('❌ SSO Authentication error:', error);
        setAuthError('Authentication failed: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    processSsoAuthentication();
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-gray-700">Verifying authentication...</h2>
        </div>
      </div>
    );
  }
  
  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-700 mb-2">Authentication Error</h2>
            <p className="text-gray-500 mb-4">{authError}</p>
            <a 
              // href="http://client.exim.alvision.in.s3-website.ap-south-1.amazonaws.com/login" 
              href="http://localhost:3001/login"
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  return <Dashboard />
}

export default App
