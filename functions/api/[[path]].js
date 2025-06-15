import app from '../../src/app-esm.js';

export async function onRequest(context) {
  const { request, env } = context;
  
  // Add environment variables to process.env
  if (env) {
    Object.keys(env).forEach(key => {
      process.env[key] = env[key];
    });
  }

  return new Promise((resolve, reject) => {
    const url = new URL(request.url);
    
    // Create Node.js-like request object
    const req = {
      method: request.method,
      url: url.pathname + url.search,
      path: url.pathname.replace('/api', '') || '/', // Remove /api prefix, default to /
      query: Object.fromEntries(url.searchParams),
      headers: Object.fromEntries(request.headers),
      body: null,
      params: {},
      get: function(header) {
        return this.headers[header.toLowerCase()];
      }
    };

    // Handle request body for POST/PUT/PATCH requests
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
      }).catch(reject);
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

      // Set timeout to prevent hanging requests
      const timeout = setTimeout(() => {
        if (!res.finished) {
          res.status(500).json({ error: 'Request timeout' });
        }
      }, 25000); // 25 second timeout (Pages Functions have 30s limit)

      try {
        // Handle the request with Express
        app(req, res, (err) => {
          clearTimeout(timeout);
          if (err) {
            console.error('Express error:', err);
            if (!res.finished) {
              res.status(500).json({ error: 'Internal Server Error', message: err.message });
            }
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        console.error('Processing error:', error);
        if (!res.finished) {
          res.status(500).json({ error: 'Internal Server Error', message: error.message });
        }
      }
    }
  });
} 