# Vercel Deployment Guide for TEC LMS

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- GitHub repository connected (already done: https://github.com/chhinhsovath/plp-tec)

## Step 1: Install Vercel CLI (Optional)
```bash
npm i -g vercel
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)
1. Go to https://vercel.com/new
2. Import your GitHub repository: `chhinhsovath/plp-tec`
3. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `./` (or `tec-lms` if you have it in a subdirectory)
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Option B: Deploy via CLI
```bash
cd tec-lms
vercel
```

## Step 3: Configure Environment Variables in Vercel

Go to your Vercel project settings → Environment Variables and add:

### Required Environment Variables:

⚠️ **IMPORTANT**: In Vercel, you need to add these as "Secrets" not regular environment variables for sensitive data.

1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable below (use the names exactly as shown):

```bash
# Database (Add as Secret)
database_url - Your PostgreSQL connection string
Example format: postgresql://username:password@host:port/database?sslmode=require

# Authentication (Add as Secret)
nextauth_url - Your deployment URL (e.g., https://your-app.vercel.app)
nextauth_secret - Generate with: openssl rand -base64 32

# AI Chatbot (Add as Secret)
openrouter_api_key - Your OpenRouter API key from https://openrouter.ai/
openrouter_model - Model to use (e.g., openai/gpt-3.5-turbo)
```

**Note**: The variable names in Vercel should be lowercase (e.g., `database_url` not `DATABASE_URL`) because vercel.json references them with `@database_url` syntax.

### Optional Environment Variables:

```bash
# Email (if using email features)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@tec-lms.com"

# File Storage
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"

# HRMIS Integration (if needed)
HRMIS_API_URL="https://hrmis.example.com/api"
HRMIS_API_KEY="your-hrmis-api-key"
```

## Step 4: Update Your Code

1. Update `NEXTAUTH_URL` in environment variables:
   - Replace `https://your-app-name.vercel.app` with your actual Vercel URL

2. Commit and push changes:
```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

## Step 5: Database Migrations

After deployment, run migrations:

1. Install Vercel CLI if not already installed
2. Run migrations:
```bash
vercel env pull .env.local
npx prisma migrate deploy
npx prisma db seed
```

## Important Security Notes

### Generate JWT Secret
You need to generate a secure JWT secret for production. Use this command:

```bash
# Generate a secure 32-byte secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

⚠️ **IMPORTANT**: 
- Never commit secrets to your repository
- Keep your JWT secret safe and secure
- Use different secrets for different environments (development, staging, production)

## Step 6: Post-Deployment Checklist

- [ ] Verify all environment variables are set in Vercel
- [ ] Update `NEXTAUTH_URL` with your actual Vercel URL
- [ ] Run database migrations
- [ ] Seed initial data (optional)
- [ ] Test authentication flow
- [ ] Test AI chatbot functionality
- [ ] Check responsive design on mobile

## Troubleshooting

### Database Connection Issues
- Ensure your PostgreSQL database allows connections from Vercel's IP addresses
- Check if SSL is required: add `?sslmode=require` to DATABASE_URL

### Build Errors
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Authentication Issues
- Verify `NEXTAUTH_URL` matches your deployment URL exactly
- Ensure `NEXTAUTH_SECRET` is set correctly
- Check browser console for errors

## Production URLs
After deployment, your app will be available at:
- Production: `https://your-project-name.vercel.app`
- Preview: `https://your-project-name-git-branch-name.vercel.app`

## Monitoring
- View logs: Vercel Dashboard → Functions → Logs
- Analytics: Vercel Dashboard → Analytics
- Performance: Vercel Dashboard → Speed Insights