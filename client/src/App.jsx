import React, { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import { apiService } from './services/api';
import { AlertCircle, Loader2 } from 'lucide-react';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const processSsoAuthentication = async () => {
      try {
        setIsLoading(true);
        console.log('🔍 Starting SSO authentication process...');
        
        // Check if we have a token in the URL
        const urlToken = apiService.getTokenFromUrl();
        console.log('🔎 URL token found:', urlToken ? 'Yes' : 'No');
        
        if (urlToken) {
          console.log('✅ Found token in URL, processing...');
          // Save the URL token immediately
          apiService.saveToken(urlToken, true);
        } else {
          console.log('⚠️ No token in URL, checking stored tokens...');
          
          // Check for existing stored tokens
          const storedToken = localStorage.getItem('exim_sso_token') || 
                             localStorage.getItem('jwt_token') || 
                             sessionStorage.getItem('jwt_token');
          
          if (!storedToken) {
            console.log('❌ No stored token found, redirecting to login...');
            throw new Error('No authentication token found');
          }
          
          console.log('📦 Using stored token for authentication');
        }
        
        // Process the SSO token (verify with server)
        console.log('⏳ Verifying token with server...');
        const result = await apiService.processSsoToken(false); // Don't auto-redirect
        
        if (result.success) {
          console.log('✅ Authentication successful!');
          setIsAuthenticated(true);
          setAuthError(null);
        } else {
          console.error('❌ Authentication failed:', result.error);
          setAuthError(result.error || 'Authentication failed');
          setIsAuthenticated(false);
          
          // Clear any invalid tokens
          localStorage.removeItem('exim_sso_token');
          localStorage.removeItem('jwt_token');
          sessionStorage.removeItem('jwt_token');
        }
        
      } catch (error) {
        console.error('❌ SSO Authentication error:', error);
        setAuthError(error.message || 'Authentication failed');
        setIsAuthenticated(false);
        
        // Clear any invalid tokens
        localStorage.removeItem('exim_sso_token');
        localStorage.removeItem('jwt_token');
        sessionStorage.removeItem('jwt_token');
      } finally {
        console.log('🟦 Authentication process completed');
        setIsLoading(false);
      }
    };

    processSsoAuthentication();
  }, []);

  // Handle manual login redirect
  const handleLoginRedirect = () => {
    console.log('🔄 Redirecting to login page...');
    window.location.href = 'http://localhost:3001/login';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
          <h2 className="text-xl font-medium text-gray-700 mb-2">
            Verifying Authentication
          </h2>
          <p className="text-gray-500">Please wait while we verify your credentials...</p>
        </div>
      </div>
    );
  }

  // Authentication error state
  if (authError || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-medium text-gray-700 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-500 mb-4">
              {authError || 'Please log in to access the E-Lock Tracking System'}
            </p>
            <button
              onClick={handleLoginRedirect}
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Successfully authenticated - render Dashboard
  return <Dashboard />;
}

export default App;