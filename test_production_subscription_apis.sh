#!/bin/bash

# Production Subscription API Test Script
# Tests the subscription APIs on edusmart-server.pages.dev

BASE_URL="https://edusmart-server.pages.dev/api"
EMAIL="anadi.mpvm@gmail.com"
PASSWORD="12345678"

echo "🌐 TESTING PRODUCTION SUBSCRIPTION APIs"
echo "========================================"
echo "Server: $BASE_URL"
echo "User: $EMAIL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
    else
        echo -e "${RED}❌ FAILED${NC}"
    fi
}

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}📋 $1${NC}"
    echo "----------------------------------------"
}

# Step 1: Login and get token
print_header "AUTHENTICATION"
echo "➤ Logging in user: $EMAIL"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "Login response: $LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token // .data.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}❌ Failed to get authentication token${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Successfully authenticated${NC}"
echo "Token: ${TOKEN:0:20}..."

# Step 2: Test public endpoints (no auth required)
print_header "PUBLIC ENDPOINTS"

echo "➤ Testing subscription plans endpoint"
PLANS_RESPONSE=$(curl -s "$BASE_URL/subscriptions/plans")
echo "Plans response: $PLANS_RESPONSE"
PLANS_COUNT=$(echo $PLANS_RESPONSE | jq '.data | length' 2>/dev/null || echo "0")
echo "Plans found: $PLANS_COUNT"
print_status $?

echo ""
echo "➤ Testing addon plans endpoint"
ADDONS_RESPONSE=$(curl -s "$BASE_URL/subscriptions/addons")
echo "Addons response: $ADDONS_RESPONSE"
ADDONS_COUNT=$(echo $ADDONS_RESPONSE | jq '.data | length' 2>/dev/null || echo "0")
echo "Addons found: $ADDONS_COUNT"
print_status $?

# Step 3: Test authenticated endpoints
print_header "AUTHENTICATED ENDPOINTS"

echo "➤ Testing user subscription status"
STATUS_RESPONSE=$(curl -s "$BASE_URL/subscriptions/status" \
  -H "Authorization: Bearer $TOKEN")
echo "Status response: $STATUS_RESPONSE"
print_status $?

echo ""
echo "➤ Testing response history"
HISTORY_RESPONSE=$(curl -s "$BASE_URL/subscriptions/response-history" \
  -H "Authorization: Bearer $TOKEN")
echo "History response: $HISTORY_RESPONSE"
print_status $?

echo ""
echo "➤ Testing transaction history"
TRANSACTIONS_RESPONSE=$(curl -s "$BASE_URL/subscriptions/transaction-history" \
  -H "Authorization: Bearer $TOKEN")
echo "Transactions response: $TRANSACTIONS_RESPONSE"
print_status $?

echo ""
echo "➤ Testing usage logs"
LOGS_RESPONSE=$(curl -s "$BASE_URL/subscriptions/usage-logs" \
  -H "Authorization: Bearer $TOKEN")
echo "Logs response: $LOGS_RESPONSE"
print_status $?

# Step 4: Test purchase endpoint (if no active subscription)
print_header "PURCHASE TEST"

# Check if user has active subscription
HAS_SUBSCRIPTION=$(echo $STATUS_RESPONSE | jq -r '.data.isPro // false')

if [ "$HAS_SUBSCRIPTION" = "false" ]; then
    echo "➤ User has no active subscription, testing purchase"
    
    # Get first plan ID
    PLAN_ID=$(echo $PLANS_RESPONSE | jq -r '.data[0].id // empty')
    
    if [ -n "$PLAN_ID" ] && [ "$PLAN_ID" != "null" ]; then
        echo "Testing purchase with plan ID: $PLAN_ID"
        
        PURCHASE_RESPONSE=$(curl -s -X POST "$BASE_URL/subscriptions/purchase" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d "{
            \"planId\": \"$PLAN_ID\",
            \"paymentMethod\": \"test\",
            \"transactionId\": \"test_prod_$(date +%s)\",
            \"amount\": 9.99
          }")
        
        echo "Purchase response: $PURCHASE_RESPONSE"
        print_status $?
    else
        echo -e "${YELLOW}⚠️ No plan ID found, skipping purchase test${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ User already has active subscription, skipping purchase test${NC}"
fi

print_header "SUMMARY"
echo "✅ Production subscription API testing completed"
echo "🌐 Server: edusmart-server.pages.dev"
echo "📊 Check the responses above for any errors"
echo "" 