#!/bin/bash

# EduSmart Subscription API Testing Script
# Make sure your server is running on localhost:8000

BASE_URL="http://localhost:8000/api"
AUTH_TOKEN=""

echo "🚀 EduSmart Subscription API Testing Script"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}➤ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to make API calls and display results
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo ""
    print_status "$description"
    echo "Endpoint: $method $endpoint"
    
    if [ -n "$data" ]; then
        echo "Data: $data"
    fi
    
    echo "Response:"
    if [ "$method" = "GET" ]; then
        if [ -n "$AUTH_TOKEN" ]; then
            curl -s -X GET "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $AUTH_TOKEN" \
                -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "Response received (jq not available for formatting)"
        else
            curl -s -X GET "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "Response received (jq not available for formatting)"
        fi
    else
        if [ -n "$AUTH_TOKEN" ]; then
            curl -s -X "$method" "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $AUTH_TOKEN" \
                -H "Content-Type: application/json" \
                -d "$data" | jq '.' 2>/dev/null || echo "Response received (jq not available for formatting)"
        else
            curl -s -X "$method" "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data" | jq '.' 2>/dev/null || echo "Response received (jq not available for formatting)"
        fi
    fi
    echo ""
    echo "----------------------------------------"
}

# Check if server is running
print_status "Checking if server is running..."
if curl -s "$BASE_URL/../" > /dev/null; then
    print_success "Server is running!"
else
    print_error "Server is not running. Please start the server first."
    exit 1
fi

echo ""
print_warning "Note: You'll need to set AUTH_TOKEN variable for authenticated endpoints"
print_warning "Example: AUTH_TOKEN='your_jwt_token_here'"
echo ""

# 1. Test Public Endpoints (No Authentication Required)
echo "🔓 TESTING PUBLIC ENDPOINTS"
echo "=========================="

api_call "GET" "/subscriptions/plans" "" "Get all subscription plans"

api_call "GET" "/subscriptions/addons" "" "Get all addon plans"

# 2. Test User Authentication (you need to register/login first)
echo ""
echo "🔐 AUTHENTICATION REQUIRED ENDPOINTS"
echo "===================================="
print_warning "Set AUTH_TOKEN variable to test these endpoints"
print_warning "You can get a token by registering/logging in first:"
echo ""
echo "# Register a user:"
echo "curl -X POST $BASE_URL/auth/register \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"test@example.com\",\"password\":\"password123\",\"name\":\"Test User\"}'"
echo ""
echo "# Login to get token:"
echo "curl -X POST $BASE_URL/auth/login \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}'"
echo ""

if [ -n "$AUTH_TOKEN" ]; then
    print_success "Auth token found! Testing authenticated endpoints..."
    
    # Test subscription status
    api_call "GET" "/subscriptions/status" "" "Get user subscription status"
    
    # Test buying subscription (you'll need actual payment details)
    echo ""
    print_warning "The following endpoints require actual payment processing:"
    echo ""
    
    # Example subscription purchase (replace with actual payment details)
    SUBSCRIPTION_DATA='{
        "planId": "plan-id-from-plans-endpoint",
        "paymentMethod": "credit_card",
        "transactionId": "test_transaction_123",
        "amount": 9.99
    }'
    
    echo "Example subscription purchase:"
    echo "curl -X POST $BASE_URL/subscriptions/buy \\"
    echo "  -H 'Authorization: Bearer \$AUTH_TOKEN' \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '$SUBSCRIPTION_DATA'"
    
    # Example addon purchase
    ADDON_DATA='{
        "addonId": "addon-id-from-addons-endpoint",
        "paymentMethod": "credit_card",
        "transactionId": "test_addon_transaction_123",
        "amount": 4.99
    }'
    
    echo ""
    echo "Example addon purchase:"
    echo "curl -X POST $BASE_URL/subscriptions/buy-addon \\"
    echo "  -H 'Authorization: Bearer \$AUTH_TOKEN' \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '$ADDON_DATA'"
    
    # Test response usage
    echo ""
    RESPONSE_DATA='{
        "responseType": "course_query",
        "queryData": {"query": "test query", "result": "test result"},
        "responsesUsed": 1
    }'
    
    echo "Example response usage:"
    echo "curl -X POST $BASE_URL/subscriptions/use-response \\"
    echo "  -H 'Authorization: Bearer \$AUTH_TOKEN' \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '$RESPONSE_DATA'"
    
    # Test history endpoints
    api_call "GET" "/subscriptions/responses?page=1&limit=10" "" "Get response history"
    
    api_call "GET" "/subscriptions/transactions?page=1&limit=10" "" "Get transaction history"
    
    api_call "GET" "/subscriptions/usage-logs?page=1&limit=10" "" "Get usage logs"
    
else
    print_warning "AUTH_TOKEN not set. Skipping authenticated endpoint tests."
    print_warning "To test authenticated endpoints:"
    echo ""
    echo "1. First register a user:"
    echo "   curl -X POST $BASE_URL/auth/register \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{\"email\":\"test@example.com\",\"password\":\"password123\",\"name\":\"Test User\"}'"
    echo ""
    echo "2. Login to get a token:"
    echo "   curl -X POST $BASE_URL/auth/login \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}'"
    echo ""
    echo "3. Set the token and run this script again:"
    echo "   AUTH_TOKEN='your_token_here' ./test_subscription_apis.sh"
fi

# 3. Admin Endpoints
echo ""
echo "👑 ADMIN ENDPOINTS"
echo "=================="
print_warning "These require admin authentication"

echo "# Get all subscriptions (admin):"
echo "curl -X GET $BASE_URL/subscriptions/admin/all \\"
echo "  -H 'Authorization: Bearer \$ADMIN_TOKEN' \\"
echo "  -H 'Content-Type: application/json'"

echo ""
echo "# Refresh responses (admin):"
echo "curl -X POST $BASE_URL/subscriptions/admin/refresh-responses \\"
echo "  -H 'Authorization: Bearer \$ADMIN_TOKEN' \\"
echo "  -H 'Content-Type: application/json'"

echo ""
echo "🎯 TESTING COMPLETE!"
echo "==================="
print_success "All API endpoints have been tested or documented"
print_warning "Remember to:"
echo "1. Run the SQL schema in your Supabase database"
echo "2. Set up proper authentication tokens"
echo "3. Configure actual payment processing for buy endpoints"
echo "4. Set up proper admin authentication"

echo ""
echo "📚 API ENDPOINTS SUMMARY:"
echo "========================"
echo "Public Endpoints:"
echo "  GET  /api/subscriptions/plans"
echo "  GET  /api/subscriptions/addons"
echo ""
echo "User Endpoints (require auth):"
echo "  POST /api/subscriptions/buy"
echo "  POST /api/subscriptions/buy-addon"
echo "  GET  /api/subscriptions/status"
echo "  POST /api/subscriptions/use-response"
echo "  GET  /api/subscriptions/responses"
echo "  GET  /api/subscriptions/transactions"
echo "  GET  /api/subscriptions/usage-logs"
echo ""
echo "Admin Endpoints (require admin auth):"
echo "  GET  /api/subscriptions/admin/all"
echo "  POST /api/subscriptions/admin/refresh-responses" 