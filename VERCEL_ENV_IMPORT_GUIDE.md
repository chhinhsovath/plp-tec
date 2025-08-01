# How to Import Environment Variables to Vercel

## Method 1: Bulk Import (Easiest)

1. **Copy all content from `.env.vercel` file**
   - Open `.env.vercel` 
   - Select all text (Ctrl+A or Cmd+A)
   - Copy (Ctrl+C or Cmd+C)

2. **Go to Vercel Dashboard**
   - Open https://vercel.com
   - Click on your `plp-tec` project
   - Go to **Settings** → **Environment Variables**

3. **Import Environment Variables**
   - Look for "Add Multiple" or "Bulk Edit" button
   - OR click the "..." menu and select "Import .env"
   - Paste the entire content
   - Select environments: ✓ Production ✓ Preview ✓ Development
   - Click **Save** or **Import**

## Method 2: One by One (If bulk import doesn't work)

Add each variable from `.env.vercel` individually:
1. Click "Add New"
2. Enter the key (e.g., `DATABASE_URL`)
3. Enter the value
4. Select all environments
5. Click "Save"

## After Import

1. **Verify all variables are added**
   You should see these in your Environment Variables list:
   - DATABASE_URL
   - NEXTAUTH_URL
   - NEXTAUTH_SECRET
   - OPENROUTER_API_KEY
   - OPENROUTER_MODEL
   - NODE_ENV
   - APP_URL
   - EMAIL_FROM
   - (and all others from .env.vercel)

2. **Trigger new deployment**
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Select "Redeploy"

## Important Notes

- The new `vercel.json` doesn't use `@secret_name` syntax anymore
- All environment variables are now regular variables (not secrets)
- Make sure NEXTAUTH_URL and APP_URL use your actual domain
- If using custom domain (tec.openplp.com), update those URLs accordingly

## Test After Deployment

Visit these URLs:
- https://plp-tec.vercel.app
- https://plp-tec.vercel.app/auth/signin
- https://tec.openplp.com (if custom domain is set up)