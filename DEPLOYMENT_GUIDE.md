# Complete Cloudflare Pages Migration Guide

## 🚀 Quick Start Summary

You now have two migration options:

1. **Cloudflare Pages with Functions** (Recommended) - Easier migration, better Node.js compatibility
2. **Cloudflare Workers** - More complex, requires more code changes

## 📁 Files Created

✅ `functions/api/[[path]].js` - Pages Functions handler
✅ `_routes.json` - Routing configuration
✅ `src/app-esm.js` - ES module version of your Express app
✅ `wrangler.toml` - Cloudflare Workers configuration (if you choose Workers)
✅ `CLOUDFLARE_PAGES_MIGRATION.md` - Detailed Pages migration guide
✅ `CLOUDFLARE_MIGRATION.md` - Workers migration guide

## 🎯 Recommended Approach: Cloudflare Pages

### Step 1: Choose Your Deployment Method

#### Option A: Git Integration (Recommended)
1. Push your code to GitHub/GitLab
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) > Pages
3. Click "Create a project" > "Connect to Git"
4. Select your repository
5. Configure build settings:
   - **Build command**: `npm install`
   - **Build output directory**: `/` (root)
   - **Root directory**: `/` (root)

#### Option B: Direct Upload
```bash
npm install -g @cloudflare/pages-cli
npx pages-cli deploy
```

### Step 2: Set Environment Variables

In Cloudflare Dashboard > Pages > Your Project > Settings > Environment Variables, add:

```
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
NODE_ENV=production
```

### Step 3: Update Your Route Files (Important!)

Your route files need to be converted to ES modules. For each file in `src/routes/`, change:

**From CommonJS:**
```javascript
const express = require('express');
module.exports = router;
```

**To ES Modules:**
```javascript
import express from 'express';
export default router;
```

### Step 4: Test Your Deployment

1. Your API will be available at: `https://your-project-name.pages.dev/api/`
2. Test the root endpoint: `https://your-project-name.pages.dev/api/`
3. Test specific endpoints: `https://your-project-name.pages.dev/api/auth/login`

### Step 5: Update Frontend Applications

Update your frontend applications to use the new Cloudflare Pages URL:
```javascript
const API_BASE_URL = 'https://your-project-name.pages.dev/api';
```

## 🔧 Converting Route Files to ES Modules

You'll need to convert all your route files. Here's a script to help:

```bash
# Create a backup first
cp -r src/routes src/routes-backup

# Then manually convert each file or use this pattern:
```

**Example conversion for `src/routes/authRoutes.js`:**

**Before:**
```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

// ... your routes ...

module.exports = router;
```

**After:**
```javascript
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

// ... your routes ...

export default router;
```

## 🌐 CORS Configuration

Your CORS is already configured for Cloudflare Pages. Update the domains in `src/app-esm.js`:

```javascript
const allowedOrigins = [
  // ... existing origins ...
  'https://your-actual-project-name.pages.dev', // Replace with your actual domain
];
```

## 📊 Performance & Limitations

### Cloudflare Pages Functions Limits:
- **Execution time**: 30 seconds (vs Vercel's 10s for hobby plan)
- **Memory**: 128MB
- **Request size**: 100MB
- **Response size**: 25MB

### Benefits:
- **Global edge deployment** - Faster response times worldwide
- **Automatic scaling** - No cold start issues
- **Built-in DDoS protection**
- **Free tier**: 100,000 requests/month
- **Cost**: $0.50 per million requests after free tier

## 🚨 Troubleshooting

### Common Issues:

1. **"Cannot resolve module" errors**
   - Make sure all your route files are converted to ES modules
   - Check import paths end with `.js`

2. **CORS errors**
   - Update allowed origins in `src/app-esm.js`
   - Check that your frontend is using the correct API URL

3. **Environment variables not working**
   - Ensure all environment variables are set in Cloudflare Dashboard
   - Variables are case-sensitive

4. **Database connection issues**
   - Supabase should work fine (designed for serverless)
   - Check if your database allows connections from Cloudflare IPs

### Debug Steps:
1. Check Cloudflare Dashboard > Pages > Your Project > Functions for logs
2. Use `console.log()` statements in your functions
3. Test individual endpoints with curl or Postman

## 🔄 Rollback Plan

If you need to rollback:
1. Keep your Vercel deployment active during testing
2. Your original files are preserved (`src/app.js`, `vercel.json`)
3. Simply update your frontend URLs back to Vercel

## 📈 Monitoring

After deployment:
1. Monitor response times in Cloudflare Analytics
2. Check error rates in Functions logs
3. Set up alerts for high error rates
4. Monitor database connection usage

## 🎉 Next Steps

1. **Convert all route files to ES modules**
2. **Deploy to Cloudflare Pages**
3. **Set environment variables**
4. **Test all endpoints**
5. **Update frontend applications**
6. **Monitor performance**
7. **Gradually migrate traffic**

## 💡 Pro Tips

1. **Use staging environment**: Deploy to staging first, test thoroughly
2. **Gradual migration**: Use DNS to gradually shift traffic
3. **Monitor closely**: Watch for any issues in the first 24-48 hours
4. **Keep backups**: Don't delete your Vercel deployment immediately

## 🆘 Need Help?

If you encounter issues:
1. Check the Cloudflare Pages documentation
2. Review the function logs in your dashboard
3. Test with simple endpoints first
4. Ensure all dependencies are properly imported

Your migration is now ready! The main work remaining is converting your route files to ES modules and deploying to Cloudflare Pages. 