# Step-by-Step Guide to Add Vercel Secrets

## The Problem
Your `vercel.json` file references secrets using `@secret_name` syntax:
```json
"DATABASE_URL": "@database_url"
```

This means Vercel is looking for a secret named `database_url` (lowercase).

## How to Fix - Add Secrets in Vercel Dashboard

### Step 1: Go to Environment Variables
1. Open [Vercel Dashboard](https://vercel.com)
2. Click on your `plp-tec` project
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar

### Step 2: Add Each Secret (EXACTLY as shown)

Click "Add New" and fill in EXACTLY:

#### Secret 1: database_url
- **Key**: `database_url` (⚠️ MUST be lowercase)
- **Value**: `postgresql://admin:P@ssw0rd@157.10.73.52:5432/plp_tec?schema=public`
- **Environment**: Select all (Production, Preview, Development)
- **Type**: Select "Sensitive" ✓
- Click **Save**

#### Secret 2: nextauth_url
- **Key**: `nextauth_url` (⚠️ MUST be lowercase)
- **Value**: `https://plp-tec.vercel.app`
- **Environment**: Select all
- **Type**: Select "Sensitive" ✓
- Click **Save**

#### Secret 3: nextauth_secret
- **Key**: `nextauth_secret` (⚠️ MUST be lowercase)
- **Value**: `LfJiVpFbYNDG7PnLhW3UCCRfslk8Laa2QJ1wFrXtTYI=`
- **Environment**: Select all
- **Type**: Select "Sensitive" ✓
- Click **Save**

#### Secret 4: openrouter_api_key
- **Key**: `openrouter_api_key` (⚠️ MUST be lowercase)
- **Value**: `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`
- **Environment**: Select all
- **Type**: Select "Sensitive" ✓
- Click **Save**

#### Secret 5: openrouter_model
- **Key**: `openrouter_model` (⚠️ MUST be lowercase)
- **Value**: `openai/gpt-3.5-turbo`
- **Environment**: Select all
- **Type**: Select "Sensitive" ✓
- Click **Save**

### Step 3: Verify Your Secrets
After adding all 5 secrets, you should see them listed like:
- `database_url` (Sensitive) - All Environments
- `nextauth_url` (Sensitive) - All Environments
- `nextauth_secret` (Sensitive) - All Environments
- `openrouter_api_key` (Sensitive) - All Environments
- `openrouter_model` (Sensitive) - All Environments

### Step 4: Redeploy
1. Go to **Deployments** tab
2. Click the three dots (...) on the latest deployment
3. Select **Redeploy**
4. Click **Redeploy** in the popup

## Common Mistakes to Avoid

❌ DON'T add as regular environment variable - use "Sensitive" type
❌ DON'T use uppercase names (DATABASE_URL) - use lowercase (database_url)
❌ DON'T add quotes around the values
❌ DON'T forget to select all environments

## Why This Error Happens

The `vercel.json` file uses this syntax:
```json
"DATABASE_URL": "@database_url"
```

The `@database_url` means "get the value from a secret named database_url".
If that secret doesn't exist, you get the error.

## Alternative Solution (if secrets don't work)

If you continue having issues, you can remove the @ references from vercel.json and add regular environment variables instead:

1. Remove/rename `vercel.json` to `vercel.json.backup`
2. Add environment variables with UPPERCASE names directly:
   - `DATABASE_URL` (not database_url)
   - `NEXTAUTH_URL` (not nextauth_url)
   - etc.