# Cloudflare Workers Migration Guide

## Overview
This guide will help you migrate your EduSmart API from Vercel to Cloudflare Workers.

## Prerequisites
1. Cloudflare account
2. Wrangler CLI installed globally (`npm install -g wrangler`)
3. Your existing environment variables

## Step-by-Step Migration

### 1. Authenticate with Cloudflare
```bash
wrangler login
```
This will open a browser window to authenticate with your Cloudflare account.

### 2. Update wrangler.toml Configuration
Edit the `wrangler.toml` file and replace `your-subdomain` with your actual Cloudflare subdomain:
```toml
name = "edusmart-api"
main = "src/worker.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
```

### 3. Set Environment Variables
You'll need to set your environment variables as secrets in Cloudflare Workers:

```bash
# Set each environment variable as a secret
wrangler secret put DATABASE_URL
wrangler secret put JWT_SECRET
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
# Add all other environment variables you're using
```

When prompted, paste the actual values for each variable.

### 4. Update CORS Configuration
In `src/app.js`, update the Cloudflare Workers domains:
- Replace `your-subdomain` with your actual Cloudflare subdomain
- The format will be: `https://edusmart-api.your-subdomain.workers.dev`

### 5. Test Locally
```bash
npm run cf:dev
```
This will start a local development server that mimics the Cloudflare Workers environment.

### 6. Deploy to Staging
```bash
npm run cf:deploy:staging
```

### 7. Deploy to Production
```bash
npm run cf:deploy:production
```

## Important Considerations

### Database Connections
- Cloudflare Workers have different connection limits compared to traditional servers
- Consider using connection pooling or Cloudflare D1 for database operations
- Supabase should work fine as it's designed for serverless environments

### File Uploads
- If you're handling file uploads, consider using Cloudflare R2 (S3-compatible storage)
- Update your upload routes to use R2 instead of local file system

### Environment Variables
- All environment variables must be set as secrets using `wrangler secret put`
- They will be available in the `env` parameter of your worker

### Limitations
- Workers have a 10ms CPU time limit per request
- Memory is limited to 128MB
- Some Node.js APIs might not be available

## Monitoring and Debugging

### View Logs
```bash
wrangler tail
```

### View Analytics
Check your Cloudflare dashboard for worker analytics and performance metrics.

## Rollback Plan
If you need to rollback:
1. Keep your Vercel deployment active during testing
2. Update DNS/frontend URLs back to Vercel if needed
3. Your original `vercel.json` configuration is preserved

## Performance Benefits
- Global edge deployment (faster response times)
- Automatic scaling
- Better cold start performance
- Built-in DDoS protection

## Cost Comparison
- Cloudflare Workers: 100,000 requests/day free, then $0.50 per million requests
- Generally more cost-effective than Vercel for high-traffic applications

## Next Steps After Migration
1. Update your frontend applications to use the new Cloudflare Workers URL
2. Update any external services that call your API
3. Monitor performance and error rates
4. Consider implementing Cloudflare-specific optimizations (caching, etc.)

## Troubleshooting

### Common Issues
1. **CORS errors**: Make sure to update all allowed origins in your CORS configuration
2. **Environment variables not working**: Ensure all secrets are set using `wrangler secret put`
3. **Database connection issues**: Check if your database allows connections from Cloudflare's IP ranges
4. **Request timeout**: Workers have strict time limits, optimize long-running operations

### Getting Help
- Cloudflare Workers documentation: https://developers.cloudflare.com/workers/
- Wrangler CLI documentation: https://developers.cloudflare.com/workers/wrangler/ 