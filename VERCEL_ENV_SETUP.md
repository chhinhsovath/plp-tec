# Vercel Environment Variables Setup - ACTUAL DATA

## ⚠️ IMPORTANT: Add These Exact Values to Vercel

Go to: [Vercel Dashboard](https://vercel.com) → Your Project → Settings → Environment Variables

### Required Secrets (Add these with LOWERCASE names):

| Secret Name | Value |
|------------|-------|
| `database_url` | `postgresql://admin:P@ssw0rd@157.10.73.52:5432/plp_tec?schema=public` |
| `nextauth_url` | `https://plp-tec.vercel.app` |
| `nextauth_secret` | `LfJiVpFbYNDG7PnLhW3UCCRfslk8Laa2QJ1wFrXtTYI=` |
| `openrouter_api_key` | `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` |
| `openrouter_model` | `openai/gpt-3.5-turbo` |

### Additional Environment Variables (Already Added):

These you've already added, keep them as is:
- EMAIL_FROM = `noreply@openplp.com`
- UPLOAD_DIR = `./uploads`
- MAX_FILE_SIZE = `10485760`
- SOCKET_PORT = `3001`
- HRMIS_API_URL = `https://tec.openplp.com/api`
- HRMIS_API_KEY = `your-hrmis-api-key`
- NODE_ENV = `production`
- APP_URL = `https://plp-tec.vercel.app`

### Email Configuration (Optional - Add if needed):

| Variable Name | Value |
|--------------|-------|
| EMAIL_SERVER_HOST | `smtp.gmail.com` |
| EMAIL_SERVER_PORT | `587` |
| EMAIL_SERVER_USER | `chhinhs@gmail.com` |
| EMAIL_SERVER_PASSWORD | `[App Password - See Gmail Setup]` |

## Step-by-Step Instructions:

1. **For each required secret above:**
   - Click "Add New"
   - Enter the name in lowercase (e.g., `database_url`)
   - Paste the exact value
   - Select "All Environments"
   - Toggle "Sensitive" ON for security
   - Click "Save"

2. **Important Notes:**
   - The secret names MUST be lowercase
   - Copy the values exactly as shown
   - The `nextauth_secret` has been securely generated for you

3. **After adding all secrets:**
   - Go to Deployments tab
   - Click "Redeploy" on the latest deployment
   - Select "Redeploy"

## For Custom Domain (tec.openplp.com):

Once deployment works, update these:
1. Change `nextauth_url` to `https://tec.openplp.com`
2. Change `APP_URL` to `https://tec.openplp.com`
3. Add custom domain in Vercel: Settings → Domains → Add `tec.openplp.com`

## Gmail App Password Setup:

For EMAIL_SERVER_PASSWORD:
1. Go to Google Account Settings
2. Security → 2-Step Verification (must be enabled)
3. App passwords → Generate new app password
4. Use that password instead of your regular Gmail password

## Verification:

After deployment, check:
- Build logs in Vercel dashboard
- Function logs for any runtime errors
- Visit your app URL to test functionality