# Antom Payment Integration for EduSmart

This document describes the complete Antom payment integration for the EduSmart platform.

## Overview

The integration provides seamless payment processing through Antom (Alipay Global) for subscription and addon purchases. All payment operations use proper RSA signature authentication and support real-time payment status updates via webhooks.

## Configuration

### Antom Credentials
- **Client ID**: `5YEX0L302DFU04384`
- **Domain**: `https://open-sea-global.alipay.com`
- **Antom Public Key**: Configured for signature verification
- **Merchant Private Key**: Configured for signature generation

### Environment Variables
```bash
BASE_URL=http://localhost:3000  # Your server URL for webhooks
```

## Database Schema

### Payment Transactions Table
The `payment_transactions` table stores all payment data:

```sql
-- Run this SQL to create the table
CREATE TABLE payment_transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    plan_id INTEGER REFERENCES subscription_plans(id),
    addon_id INTEGER REFERENCES addon_plans(id),
    payment_request_id VARCHAR(255) NOT NULL UNIQUE,
    order_id VARCHAR(255) NOT NULL,
    payment_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method_type VARCHAR(50) NOT NULL DEFAULT 'CARD',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_status VARCHAR(50),
    payment_result_code VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    webhook_received_at TIMESTAMP WITH TIME ZONE,
    payment_data JSONB,
    metadata JSONB
);
```

## API Endpoints

### 1. Create Subscription Payment
**POST** `/api/subscriptions/payment/subscription`

Creates a payment request for a subscription plan.

#### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "planId": 1,
  "currency": "USD",
  "paymentMethodType": "CARD",
  "terminalType": "WEB",
  "redirectUrl": "https://yourdomain.com/payment/success",
  "notifyUrl": "https://yourdomain.com/api/antom/notify"
}
```

#### Response
```json
{
  "success": true,
  "message": "Payment created successfully",
  "data": {
    "paymentRequestId": "uuid-generated-id",
    "orderId": "order-uuid",
    "paymentUrl": "https://antom-payment-url",
    "normalUrl": "https://alternative-payment-url",
    "plan": { ... },
    "paymentResponse": { ... }
  }
}
```

### 2. Create Addon Payment
**POST** `/api/subscriptions/payment/addon`

Creates a payment request for an addon purchase.

#### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "addonId": 1,
  "currency": "USD",
  "paymentMethodType": "CARD",
  "terminalType": "WEB",
  "redirectUrl": "https://yourdomain.com/payment/success",
  "notifyUrl": "https://yourdomain.com/api/antom/notify"
}
```

### 3. Query Payment Status
**GET** `/api/antom/status/:paymentRequestId`

Queries the current status of a payment.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "paymentRequestId": "payment-id",
    "status": "SUCCESS|FAIL|PROCESSING|CANCELLED|PENDING",
    "resultCode": "SUCCESS",
    "paymentRecord": { ... },
    "antomResponse": { ... }
  }
}
```

### 4. Cancel Payment
**POST** `/api/antom/cancel/:paymentRequestId`

Cancels a pending payment.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response
```json
{
  "success": true,
  "message": "Payment cancelled successfully",
  "data": {
    "paymentRequestId": "payment-id",
    "antomResponse": { ... }
  }
}
```

### 5. Payment History
**GET** `/api/antom/history?page=1&limit=20&status=completed`

Retrieves payment history for the authenticated user.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "payments": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### 6. Webhook Notification
**POST** `/api/antom/notify`

Receives payment status notifications from Antom (no authentication required).

#### Headers (from Antom)
```
client-id: 5YEX0L302DFU04384
request-time: 2024-01-01T12:00:00Z
signature: base64-encoded-signature
Content-Type: application/json
```

#### Request Body (from Antom)
```json
{
  "paymentRequestId": "payment-id",
  "paymentStatus": "SUCCESS",
  "result": {
    "resultCode": "SUCCESS",
    "resultMessage": "Payment successful"
  }
}
```

## Payment Flow

### Subscription Purchase Flow
1. **User selects plan** → Frontend calls `/api/subscriptions/payment/subscription`
2. **Payment created** → Returns payment URL for user to complete payment
3. **User completes payment** → Antom processes payment and sends webhook
4. **Webhook processed** → System creates subscription and activates user account
5. **User receives access** → Subscription is active with response credits

### Addon Purchase Flow
1. **User selects addon** → Frontend calls `/api/subscriptions/payment/addon`
2. **Payment created** → Returns payment URL for user to complete payment
3. **User completes payment** → Antom processes payment and sends webhook
4. **Webhook processed** → System adds responses to user's existing subscription
5. **User receives credits** → Additional responses are available immediately

## Testing

### Setup Test Environment
```bash
# 1. Create database table
# Execute: database/payment_transactions_table.sql

# 2. Setup test data
node setup-antom-test.js

# 3. Run comprehensive tests
node test-antom-apis.js
```

### Test Requirements
- Server running on configured port
- Database with required tables
- Test user account (matrixai.global@gmail.com / 12345678)
- At least one subscription plan
- At least one addon plan

### Test Coverage
- ✅ Signature generation and verification
- ✅ Payment creation for subscriptions
- ✅ Payment creation for addons
- ✅ Payment status queries
- ✅ Payment cancellation
- ✅ Payment history retrieval
- ✅ Webhook signature verification
- ✅ Automatic subscription/addon processing

## Security Features

### RSA Signature Authentication
- All API requests signed with merchant private key
- All webhook notifications verified with Antom public key
- Prevents unauthorized API access and webhook spoofing

### Input Validation
- All payment amounts validated and converted to minor units
- User authentication required for all payment operations
- Plan/addon existence verified before payment creation

### Error Handling
- Comprehensive error messages for debugging
- Graceful handling of Antom API failures
- Webhook retry protection for invalid signatures

## Integration with Existing System

The Antom integration seamlessly works with your existing subscription system:

### Backward Compatibility
- Original `/api/subscriptions/buy` and `/api/subscriptions/buy-addon` endpoints remain functional
- New Antom endpoints provide additional payment options
- Database schema extends existing tables without breaking changes

### Subscription Processing
- Successful payments automatically create subscriptions
- Response credits are added immediately
- Usage logs track all payment-related activities
- Admin endpoints work with both legacy and Antom payments

## Troubleshooting

### Common Issues

#### 1. Signature Verification Failed
- **Cause**: Incorrect private/public key configuration
- **Solution**: Verify key format and content in `antomService.js`

#### 2. Payment Creation Failed
- **Cause**: Invalid credentials or API endpoint
- **Solution**: Check Client ID and domain configuration

#### 3. Webhook Not Received
- **Cause**: Incorrect notify URL or server not accessible
- **Solution**: Ensure webhook URL is publicly accessible

#### 4. Database Errors
- **Cause**: Missing payment_transactions table
- **Solution**: Run the SQL migration script

### Debug Logging
The integration includes comprehensive logging:
- All API requests and responses
- Signature generation details
- Webhook processing steps
- Payment status changes

### Support Contacts
- **Antom Technical Support**: For API-related issues
- **Development Team**: For integration-specific problems

## Production Deployment

### Pre-deployment Checklist
- [ ] Database migration executed
- [ ] Environment variables configured
- [ ] Webhook URLs updated to production domains
- [ ] SSL certificates valid for webhook endpoints
- [ ] Test payments verified in Antom dashboard
- [ ] Error monitoring configured

### Monitoring
- Monitor webhook endpoint availability
- Track payment success/failure rates
- Monitor signature verification failures
- Alert on unusual payment patterns

---

## API Reference Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/subscriptions/payment/subscription` | POST | Create subscription payment | Yes |
| `/api/subscriptions/payment/addon` | POST | Create addon payment | Yes |
| `/api/antom/status/:id` | GET | Query payment status | Yes |
| `/api/antom/cancel/:id` | POST | Cancel payment | Yes |
| `/api/antom/history` | GET | Payment history | Yes |
| `/api/antom/notify` | POST | Webhook endpoint | No |

All authenticated endpoints require `Authorization: Bearer <jwt_token>` header.

---

**Integration Status**: ✅ Complete and Ready for Testing
**Last Updated**: January 2024
**Version**: 1.0.0 