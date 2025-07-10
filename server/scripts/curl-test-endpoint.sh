#!/bin/bash
# Test the API endpoint directly with curl

echo "🔍 Testing /api/auth/verify-token endpoint with direct curl"
echo ""

# The token to test
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODM4MGQxYjc4MzQ2ZjA2MzU2NDNjOTgiLCJpZV9jb2RlX25vIjoiODEyMDIzNzczIiwibmFtZSI6IkcuUi5NRVRBTExPWVMgUFJJVkFURSBMSU1JVEVEIiwiaWF0IjoxNzUyMTI4MjkyLCJleHAiOjE3NTIxMjg4OTJ9.u5YvvedYXcF_386GP5pkepgcJO7TYtj6bYcpsxlu188"

# The endpoint URL (try port 5003)
URL="http://localhost:5003/api/auth/verify-token"

echo "🔄 Sending request to $URL"
echo ""

# Send the POST request
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$TOKEN\"}" \
  $URL | jq .

echo ""
echo "✅ Test completed!"
