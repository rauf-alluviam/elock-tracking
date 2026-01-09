import React, { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import { apiService } from "./services/api";
import { AlertCircle, Loader2 } from "lucide-react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ElockGPSOperationPage from "./pages/ElockGPSOperationPage";
import { getAuthToken, clearAuthTokens } from "./utils/cookies";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const processSsoAuthentication = async () => {
      try {
        setIsLoading(true);

        // Check if we have a token in the URL (SSO redirect)
        const urlToken = apiService.getTokenFromUrl();
        console.log(
          "🔍 Auth Check: URL token:",
          urlToken ? "Found" : "Not found"
        );

        if (urlToken) {
          console.log("📥 Saving URL token to cookies and storage...");
          // Save the URL token immediately to cookies and localStorage
          apiService.saveToken(urlToken, true);
        } else {
          // Check for existing stored tokens (cookies first, then localStorage)
          const storedToken = getAuthToken();
          console.log(
            "📦 Auth Check: Stored token:",
            storedToken ? "Found" : "Not found"
          );

          if (!storedToken) {
            console.log("❌ No token found in URL, cookies, or localStorage");
            throw new Error("No authentication token found");
          }

          console.log("✅ Using existing stored token");
        }

        // Process the SSO token (verify with server)
        const result = await apiService.processSsoToken(false); // Don't auto-redirect

        if (result.success) {
          console.log("✅ Authentication successful");
          setIsAuthenticated(true);
          setAuthError(null);
        } else {
          console.error("❌ Authentication failed:", result.error);
          setAuthError(result.error || "Authentication failed");
          setIsAuthenticated(false);

          // Clear any invalid tokens from cookies and storage
          clearAuthTokens();
        }
      } catch (error) {
        console.error("❌ SSO Authentication error:", error);
        setAuthError(error.message || "Authentication failed");
        setIsAuthenticated(false);

        // Clear any invalid tokens from cookies and storage
        clearAuthTokens();
      } finally {
        setIsLoading(false);
      }
    };

    processSsoAuthentication();
  }, []);

  // Handle manual login redirect
  const handleLoginRedirect = () => {
    window.location.href =
      "http://client.exim.alvision.in.s3-website.ap-south-1.amazonaws.com/login";
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
          <p className="text-gray-500">
            Please wait while we verify your credentials...
          </p>
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
              {authError ||
                "Please log in to access the E-Lock Tracking System"}
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

  // Successfully authenticated - render Dashboard with routing
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/elock/:elockNo" element={<ElockGPSOperationPage />} />
    </Routes>
  );
}

export default App;
