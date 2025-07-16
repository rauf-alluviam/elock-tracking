#!/bin/bash
# Test the complete SSO authentication flow with curl

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print colored section header
print_header() {
  echo -e "${MAGENTA}\n$1${NC}"
  echo -e "${MAGENTA}$(printf '=%.0s' $(seq 1 ${#1}))${NC}\n"
}

# Print success message
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Print error message
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Print info message
print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# Read JWT_SECRET from .env file
JWT_SECRET=$(grep JWT_SECRET .env | cut -d '=' -f2)

if [ -z "$JWT_SECRET" ]; then
  print_error "JWT_SECRET not found in .env file"
  exit 1
fi

print_header "E-LOCK SSO TOKEN AUTHENTICATION TEST"
print_info "Using JWT_SECRET: ${JWT_SECRET:0:5}..."

# Generate a test token with correct format
# This requires node.js to be installed
print_info "Generating test token..."

TEST_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const secret = process.argv[1];
const payload = {
  sub: 'test-user-id',
  ie_code_no: 'TEST123456',
  name: 'TEST USER',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 10) // 10 minutes
};
console.log(jwt.sign(payload, secret));
" "$JWT_SECRET")

if [ -z "$TEST_TOKEN" ]; then
  print_error "Failed to generate token"
  exit 1
fi

print_success "Token generated: ${TEST_TOKEN:0:20}..."

# Test ports to try
PORTS=(5004 3005)

print_header "TESTING /api/auth/verify-token ENDPOINT"

for PORT in "${PORTS[@]}"; do
  URL="http://localhost:${PORT}/api/auth/verify-token"
  print_info "Trying: $URL"
  
  # Try POST request
  RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"token\": \"$TEST_TOKEN\"}" \
    $URL)
  
  if [[ $RESPONSE == *"success\":true"* ]]; then
    print_success "POST request successful to port $PORT"
    echo -e "${CYAN}$(echo $RESPONSE | json_pp 2>/dev/null || echo $RESPONSE)${NC}\n"
    break
  else
    print_error "POST request failed to port $PORT"
    echo -e "${CYAN}$(echo $RESPONSE | json_pp 2>/dev/null || echo $RESPONSE)${NC}\n"
  fi
done

print_header "TESTING PROTECTED ENDPOINT WITH TOKEN IN QUERY PARAMETER"

for PORT in "${PORTS[@]}"; do
  URL="http://localhost:${PORT}/api/auth/me?token=$TEST_TOKEN"
  print_info "Trying: $URL"
  
  # Try GET request with token as query parameter
  RESPONSE=$(curl -s -X GET "$URL")
  
  if [[ $RESPONSE == *"success\":true"* ]]; then
    print_success "GET request successful to port $PORT"
    echo -e "${CYAN}$(echo $RESPONSE | json_pp 2>/dev/null || echo $RESPONSE)${NC}\n"
    break
  else
    print_error "GET request failed to port $PORT"
    echo -e "${CYAN}$(echo $RESPONSE | json_pp 2>/dev/null || echo $RESPONSE)${NC}\n"
  fi
done

print_header "TESTING BROWSER URLs"
echo "To test in a browser, use these URLs:"
echo -e "${CYAN}http://localhost:3005/?token=$TEST_TOKEN${NC}"
echo -e "or"
echo -e "${CYAN}http://localhost:3005/api/auth/me?token=$TEST_TOKEN${NC}"

print_header "TEST COMPLETE"
