# Custom Domain Setup for tec.openplp.com

## Step 1: Add Custom Domain in Vercel

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your `plp-tec` project
3. Go to **Settings → Domains**
4. Click **Add Domain**
5. Enter: `tec.openplp.com`
6. Click **Add**

## Step 2: Configure DNS Records

You'll need to add one of these DNS configurations at your domain provider (where openplp.com is registered):

### Option A: CNAME Record (Recommended)
```
Type: CNAME
Name: tec
Value: cname.vercel-dns.com
TTL: 3600
```

### Option B: A Records
```
Type: A
Name: tec
Value: 76.76.21.21
TTL: 3600
```

## Step 3: Update Environment Variables

After domain is verified, update these in Vercel:

1. Go to Settings → Environment Variables
2. Update these values:
   - `nextauth_url` → `https://tec.openplp.com`
   - `APP_URL` → `https://tec.openplp.com`

## Step 4: Redeploy

1. Go to Deployments tab
2. Click the three dots on latest deployment
3. Select "Redeploy"

## Verification Checklist:

- [ ] Custom domain added in Vercel
- [ ] DNS records configured at domain provider
- [ ] Domain verified in Vercel (green checkmark)
- [ ] Environment variables updated
- [ ] Application redeployed

## Common Issues:

### DNS Propagation
- DNS changes can take up to 48 hours to propagate
- Use [DNS Checker](https://dnschecker.org/) to verify DNS propagation

### SSL Certificate
- Vercel automatically provisions SSL certificates
- This can take a few minutes after domain verification

### Environment Variables
- Make sure `nextauth_url` matches your custom domain exactly
- Include `https://` protocol

## Test URLs:

After setup, test these:
1. `https://tec.openplp.com` - Your custom domain
2. `https://plp-tec.vercel.app` - Default Vercel domain (should still work)