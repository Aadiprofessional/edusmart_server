# EduSmart Subscription System

This document provides a complete guide to the EduSmart subscription system implementation, including database setup, API usage, and testing instructions.

## 🏗️ System Architecture

The subscription system consists of:

1. **Subscription Plans**: Monthly and yearly subscription options
2. **User Subscriptions**: Active subscriptions with response tracking
3. **Response Management**: Track and limit API responses per user
4. **Addon System**: Additional response packages for active subscribers
5. **Transaction Tracking**: Complete payment and usage history
6. **Automatic Renewal**: Monthly response refresh for yearly subscriptions

## 📊 Database Schema

### Tables Created

1. **subscription_plans** - Available subscription plans
2. **user_subscriptions** - User's active subscriptions
3. **user_responses** - Individual response usage records
4. **subscription_transactions** - Payment transaction history
5. **addon_plans** - Available addon packages
6. **user_addons** - User's purchased addons
7. **response_usage_logs** - Detailed usage logging

### Key Features

- Row Level Security (RLS) enabled on all tables
- Automatic timestamp updates
- Proper foreign key relationships
- Indexed for performance
- Built-in data validation

## 🚀 Setup Instructions

### 1. Database Setup

Run the SQL schema in your Supabase SQL editor:

```bash
# Copy the contents of database_schema.sql and run in Supabase SQL editor
```

The schema includes:
- Table creation with proper constraints
- Default subscription plans (Monthly: $9.99, Yearly: $99.99)
- Default addon plan (50 responses: $4.99)
- Indexes for performance
- RLS policies for security
- Trigger functions for automation

### 2. Environment Variables

Ensure your `.env` file has the required Supabase credentials:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Server Setup

The subscription routes are automatically included in the main application. Start your server:

```bash
npm run dev
```

## 📋 API Endpoints

### Public Endpoints (No Authentication)

#### Get Subscription Plans
```bash
GET /api/subscriptions/plans
```
Returns all available subscription plans.

#### Get Addon Plans
```bash
GET /api/subscriptions/addons
```
Returns all available addon plans.

### User Endpoints (Authentication Required)

#### Buy Subscription
```bash
POST /api/subscriptions/buy
```
**Body:**
```json
{
  "planId": "uuid-of-plan",
  "paymentMethod": "credit_card",
  "transactionId": "external_transaction_id",
  "amount": 9.99
}
```

#### Buy Addon
```bash
POST /api/subscriptions/buy-addon
```
**Body:**
```json
{
  "addonId": "uuid-of-addon",
  "paymentMethod": "credit_card", 
  "transactionId": "external_transaction_id",
  "amount": 4.99
}
```

#### Get Subscription Status
```bash
GET /api/subscriptions/status
```
Returns user's current subscription status, remaining responses, and active addons.

#### Use Response
```bash
POST /api/subscriptions/use-response
```
**Body:**
```json
{
  "responseType": "course_query",
  "queryData": {"query": "search term", "result": "response data"},
  "responsesUsed": 1
}
```

#### Get Response History
```bash
GET /api/subscriptions/responses?page=1&limit=20&responseType=course_query
```

#### Get Transaction History
```bash
GET /api/subscriptions/transactions?page=1&limit=20&transactionType=purchase
```

#### Get Usage Logs
```bash
GET /api/subscriptions/usage-logs?page=1&limit=20&action=used
```

### Admin Endpoints (Admin Authentication Required)

#### Get All Subscriptions
```bash
GET /api/subscriptions/admin/all?page=1&limit=20&status=active
```

#### Refresh Responses (Manual Trigger)
```bash
POST /api/subscriptions/admin/refresh-responses
```

## 🔄 Subscription Logic

### Monthly Subscription Flow
1. User purchases monthly plan
2. Gets 500 responses valid for 30 days
3. After 30 days, subscription expires
4. User needs to purchase new subscription

### Yearly Subscription Flow
1. User purchases yearly plan
2. Gets 500 responses valid for 30 days
3. Every 30 days, responses refresh to 500
4. Addons expire when responses refresh
5. After 365 days, subscription expires

### Addon System
- Only available to users with active subscriptions
- Adds +50 responses to current balance
- Expires when main subscription responses refresh
- Can be purchased multiple times

## 🧪 Testing the APIs

### 1. Make the test script executable
```bash
chmod +x test_subscription_apis.sh
```

### 2. Run the test script
```bash
./test_subscription_apis.sh
```

### 3. Test with authentication
```bash
# First register and login to get a token
AUTH_TOKEN='your_jwt_token_here' ./test_subscription_apis.sh
```

## 📝 Usage Examples

### Complete User Journey

1. **Register and Login**
```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"password123"}'
```

2. **Check Available Plans**
```bash
curl -X GET http://localhost:8000/api/subscriptions/plans
```

3. **Purchase Subscription**
```bash
curl -X POST http://localhost:8000/api/subscriptions/buy \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "planId": "plan-uuid-from-step-2",
    "paymentMethod": "credit_card",
    "transactionId": "txn_123456789",
    "amount": 9.99
  }'
```

4. **Check Subscription Status**
```bash
curl -X GET http://localhost:8000/api/subscriptions/status \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

5. **Use Responses**
```bash
curl -X POST http://localhost:8000/api/subscriptions/use-response \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "responseType": "course_query",
    "queryData": {"query": "computer science courses"},
    "responsesUsed": 1
  }'
```

## 🔐 Security Features

- **Row Level Security**: Users can only access their own data
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: Built-in through response counting
- **Audit Trail**: Complete transaction and usage logging

## 🚨 Important Notes

### Payment Integration
The current implementation includes payment tracking but doesn't integrate with actual payment processors. You'll need to:

1. Integrate with Stripe, PayPal, or similar
2. Validate payments before creating subscriptions
3. Handle payment failures and refunds
4. Implement webhooks for payment status updates

### Scheduled Tasks
For production, implement scheduled tasks to:

1. **Daily**: Update expired subscriptions
2. **Monthly**: Refresh responses for yearly subscriptions
3. **Weekly**: Clean up old usage logs
4. **Monthly**: Generate subscription reports

### Monitoring
Monitor these metrics:
- Active subscriptions count
- Response usage patterns
- Revenue tracking
- Subscription churn rate
- Popular response types

## 🛠️ Customization

### Adding New Response Types
Update the `useResponse` endpoint to handle new response types:

```javascript
// Add validation for new response types
const validResponseTypes = [
  'course_query',
  'scholarship_query', 
  'university_query',
  'new_response_type' // Add here
];
```

### Modifying Subscription Plans
Update plans directly in the database:

```sql
-- Add new plan
INSERT INTO subscription_plans (name, description, price, duration_days, response_limit) 
VALUES ('Premium Plan', 'Premium with 1000 responses', 19.99, 30, 1000);

-- Modify existing plan
UPDATE subscription_plans 
SET price = 8.99, response_limit = 400 
WHERE name = 'Monthly Pro';
```

## 🐛 Troubleshooting

### Common Issues

1. **"No active subscription found"**
   - Check if user has purchased a subscription
   - Verify subscription hasn't expired
   - Check RLS policies in Supabase

2. **"Insufficient responses remaining"**
   - User has used all available responses
   - Suggest purchasing addon or new subscription

3. **Authentication errors**
   - Verify JWT token is valid
   - Check token expiration
   - Ensure proper Authorization header format

4. **Database connection issues**
   - Verify Supabase credentials in .env
   - Check network connectivity
   - Verify RLS policies are correctly set

### Debug Mode
Enable debug logging by setting:
```bash
NODE_ENV=development
```

## 📈 Future Enhancements

1. **Payment Integration**: Stripe/PayPal integration
2. **Email Notifications**: Subscription reminders and receipts
3. **Usage Analytics**: Detailed usage reports and insights
4. **Flexible Plans**: Custom response limits and durations
5. **Team Subscriptions**: Multi-user subscription management
6. **API Rate Limiting**: Advanced rate limiting beyond response counting
7. **Subscription Pausing**: Ability to pause/resume subscriptions
8. **Referral System**: Reward users for referrals

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API documentation
3. Check server logs for detailed error messages
4. Verify database schema is properly set up

---

**Last Updated**: December 2024  
**Version**: 1.0.0 