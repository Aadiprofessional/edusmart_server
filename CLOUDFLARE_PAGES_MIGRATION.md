# Cloudflare Pages with Functions Migration Guide

## Overview
This is an alternative approach to migrate your EduSmart API from Vercel to Cloudflare using **Cloudflare Pages with Functions**. This approach is better suited for Express.js applications as it provides better Node.js compatibility.

## Why Cloudflare Pages with Functions?
- Better Node.js compatibility than Workers
- Supports Express.js applications more easily
- Automatic deployments from Git
- Built-in preview deployments
- Better for full-stack applications

## Prerequisites
1. Cloudflare account
2. Git repository (GitHub, GitLab, etc.)
3. Your existing environment variables

## Step-by-Step Migration

### 1. Create Functions Directory Structure
```bash
mkdir -p functions/api
```

### 2. Create a Functions Handler
Create `functions/api/[[path]].js` to handle all API routes:

```javascript
// functions/api/[[path]].js
import app from '../../src/app.js';

export async function onRequest(context) {
  const { request, env } = context;
  
  // Add environment variables to process.env
  Object.keys(env).forEach(key => {
    process.env[key] = env[key];
  });

  return new Promise((resolve) => {
    const url = new URL(request.url);
    
    // Create Node.js-like request object
    const req = {
      method: request.method,
      url: url.pathname + url.search,
      path: url.pathname.replace('/api', ''), // Remove /api prefix
      query: Object.fromEntries(url.searchParams),
      headers: Object.fromEntries(request.headers),
      body: null,
      get: function(header) {
        return this.headers[header.toLowerCase()];
      }
    };

    // Handle request body
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      request.text().then(body => {
        if (body) {
          try {
            req.body = JSON.parse(body);
          } catch (e) {
            req.body = body;
          }
        }
        processRequest();
      });
    } else {
      processRequest();
    }

    function processRequest() {
      // Create Node.js-like response object
      const res = {
        statusCode: 200,
        headers: {},
        body: null,
        finished: false,
        
        status: function(code) {
          this.statusCode = code;
          return this;
        },
        
        json: function(data) {
          this.headers['content-type'] = 'application/json';
          this.body = JSON.stringify(data);
          this.end();
          return this;
        },
        
        send: function(data) {
          if (typeof data === 'object') {
            this.json(data);
          } else {
            this.body = data;
            this.end();
          }
          return this;
        },
        
        header: function(name, value) {
          this.headers[name.toLowerCase()] = value;
          return this;
        },
        
        set: function(name, value) {
          this.headers[name.toLowerCase()] = value;
          return this;
        },
        
        end: function(data) {
          if (data !== undefined) {
            this.body = data;
          }
          this.finished = true;
          
          resolve(new Response(this.body, {
            status: this.statusCode,
            headers: this.headers
          }));
        }
      };

      try {
        app(req, res, (err) => {
          if (err) {
            console.error('Express error:', err);
            if (!res.finished) {
              res.status(500).json({ error: 'Internal Server Error', message: err.message });
            }
          }
        });
      } catch (error) {
        console.error('Processing error:', error);
        if (!res.finished) {
          res.status(500).json({ error: 'Internal Server Error', message: error.message });
        }
      }
    }
  });
}
```

### 3. Update package.json for ES Modules
Add to your `package.json`:
```json
{
  "type": "module"
}
```

### 4. Convert app.js to ES Module
Update your `src/app.js` to use ES modules:
- Change `require()` to `import`
- Change `module.exports` to `export default`

### 5. Create _routes.json for Routing
Create `_routes.json` in your project root:
```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": []
}
```

### 6. Deploy to Cloudflare Pages

#### Option A: Connect Git Repository
1. Go to Cloudflare Dashboard > Pages
2. Click "Create a project"
3. Connect your Git repository
4. Set build settings:
   - Build command: `npm install`
   - Build output directory: `/` (root)
   - Root directory: `/` (root)

#### Option B: Direct Upload
```bash
npm install -g @cloudflare/pages-cli
npx pages-cli deploy
```

### 7. Set Environment Variables
In Cloudflare Dashboard > Pages > Your Project > Settings > Environment Variables:
- Add all your environment variables (DATABASE_URL, JWT_SECRET, etc.)

## Advantages of This Approach

1. **Better Node.js Compatibility**: Pages Functions support more Node.js features
2. **Easier Migration**: Less code changes required
3. **Git Integration**: Automatic deployments from your repository
4. **Preview Deployments**: Test changes before going live
5. **Better Debugging**: More familiar development experience

## Performance Considerations

- **Cold Starts**: Similar to Vercel, but generally faster
- **Execution Time**: 30-second limit (vs 10ms for Workers)
- **Memory**: 128MB limit
- **Concurrent Requests**: Better handling than traditional Workers

## Cost Comparison

- **Free Tier**: 100,000 requests/month
- **Paid**: $0.50 per million requests
- **Bandwidth**: Free for the first 100GB/month

## Migration Steps Summary

1. ✅ Install Wrangler CLI
2. ✅ Authenticate with Cloudflare
3. 🔄 Create functions directory structure
4. 🔄 Create API handler function
5. 🔄 Update package.json for ES modules
6. 🔄 Convert app.js to ES modules
7. 🔄 Create routing configuration
8. 🔄 Deploy to Cloudflare Pages
9. 🔄 Set environment variables
10. 🔄 Update frontend URLs
11. 🔄 Test and monitor

## Next Steps

1. Choose this approach over Workers if you want easier migration
2. Follow the detailed steps above
3. Test thoroughly before switching DNS
4. Monitor performance and error rates

This approach provides a smoother migration path with less code changes required! 