# Vercel Secrets Quick Reference

## ⚠️ CRITICAL: Add These 5 Secrets in Vercel Dashboard

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

### Step-by-Step Instructions:

1. Click "Add New" for each secret
2. Enter the exact name (lowercase) as shown below
3. Add the value
4. Select "All Environments" or specific environments
5. Click "Save"

### Required Secrets:

| Secret Name | Description | How to Get Value |
|------------|-------------|------------------|
| `database_url` | PostgreSQL connection string | Format: `postgresql://user:pass@host:port/db?sslmode=require` |
| `nextauth_url` | Your Vercel app URL | Use: `https://plp-tec.vercel.app` or your custom domain |
| `nextauth_secret` | JWT encryption secret | Generate: `openssl rand -base64 32` |
| `openrouter_api_key` | OpenRouter API key | Get from: https://openrouter.ai/keys |
| `openrouter_model` | AI model to use | Use: `openai/gpt-3.5-turbo` |

### Important Notes:

- Names must be **lowercase** (e.g., `database_url` not `DATABASE_URL`)
- These are referenced in `vercel.json` with `@` prefix (e.g., `@database_url`)
- Mark sensitive values as "Sensitive" in Vercel UI
- Different values can be set for Production/Preview/Development environments

### Generate NEXTAUTH_SECRET:

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Example DATABASE_URL formats:

```
# Local PostgreSQL
postgresql://localhost:5432/mydb

# Remote PostgreSQL with SSL
postgresql://user:password@host.com:5432/dbname?sslmode=require

# Supabase
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Neon
postgresql://user:password@ep-[name].region.aws.neon.tech/dbname?sslmode=require
```

### After Adding Secrets:

1. Trigger a new deployment in Vercel
2. Check the build logs for any errors
3. Verify the application loads correctly

### Troubleshooting:

If you still see "Environment Variable references Secret which does not exist":
- Double-check the secret name is exactly as shown (lowercase)
- Ensure there are no spaces before/after the secret name
- Try removing and re-adding the secret
- Check if the secret is available in the correct environment (Production/Preview/Development)