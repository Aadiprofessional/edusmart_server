# Environment Configuration for Google OAuth

Create a `.env` file in the root directory with the following variables:

## Supabase Configuration
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Google OAuth Configuration
```
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Application URLs
```
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

## JWT Secret
```
JWT_SECRET=your-super-secret-jwt-key-here
```

## Server Configuration
```
PORT=8000
```

## Setup Instructions

1. Create a `.env` file in both the root directory and the frontend directory
2. Copy the above configuration into the `.env` file
3. Replace `your_service_role_key_here` with your actual Supabase service role key
4. Replace `your-super-secret-jwt-key-here` with a secure JWT secret
5. Replace `your-project-id` with your actual Supabase project ID
6. Replace `your_google_client_id` and `your_google_client_secret` with your actual Google OAuth credentials

## Supabase OAuth Settings

Make sure your Supabase project has the following OAuth settings configured:

### Google OAuth Settings:
- **Enabled**: Yes
- **Client ID**: your_google_client_id.apps.googleusercontent.com
- **Client Secret**: your_google_client_secret
- **Redirect URL**: https://your-project-id.supabase.co/auth/v1/callback

### Site URL Configuration:
- **Site URL**: http://localhost:3000 (for development)
- **Additional Redirect URLs**: 
  - http://localhost:3000/auth/callback
  - https://your-production-domain.com/auth/callback (for production) 