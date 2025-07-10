# SSO Token Authentication for E-Lock Tracking System

## Overview
This document explains how the E-Lock Tracking System handles SSO (Single Sign-On) authentication with JWT tokens. The system is designed to read a JWT token from the URL, verify it, and use the IE Code Number contained within for filtering data.

## Token Flow
1. User authenticates at the main SSO provider (external system)
2. SSO provider redirects to our app with a JWT token: `http://our-app.com?token=eyJhbGci...`
3. Our app validates the token and extracts the IE Code Number
4. All API calls are filtered by this IE Code Number
5. The token is stored in the browser and attached to all subsequent API requests

## Implementation Details

### Token Structure
The JWT token should contain at least these fields:
```json
{
  "sub": "user-id",
  "ie_code_no": "ABCDE12345",
  "name": "User Name",
  "exp": 1716969926,
  "iat": 1686733926
}
```

The most important field is `ie_code_no` which is used for filtering data.

### Client-Side Implementation
- The token is read from URL parameters on page load
- It's verified through a server-side call
- If valid, it's stored in localStorage or sessionStorage
- The token is attached to all API requests using axios interceptors
- The URL is cleaned by removing the token parameter (security best practice)

### Server-Side Implementation
- A JWT middleware verifies the token in all requests
- The middleware extracts the token from:
  - URL query parameter: `?token=xxx`
  - Authorization header: `Bearer xxx`
  - Cookie: `token=xxx`
- If valid, the IE Code Number is added to the request object
- API calls use this IE Code Number to filter data
- Data is filtered using both "consignor" and "consignee" modes, with fallback

## API Filtering
The system first tries to find data where the IE Code Number matches as a consignor. If no data is found, it tries again as a consignee. This ensures the user sees all relevant data.

## Error Handling
- If the token is missing and SSO is enforced, redirect to login
- If the token is invalid or expired, redirect to login
- Authentication errors are displayed to the user

## Security Considerations
- The token is always verified with the secret key
- The token is removed from URL after reading
- The secret key is stored in environment variables only
- The token contains an expiration time
- Never trust client-side data without server verification

## How to Use
1. Set `JWT_SECRET` in your server's .env file
2. Set `SSO_ENABLED=true` to enforce token authentication
3. Set `LOGIN_REDIRECT_URL` to your login page
4. Ensure your login system redirects back with a proper JWT token

## Testing
You can generate test tokens at [jwt.io](https://jwt.io/) for development purposes. Make sure to use the same secret key as your server.
