# Deploying to Vercel

Two paths — pick whichever you prefer.

## Path A — via the Vercel dashboard (recommended)

1. **Push to GitHub** (or GitLab/Bitbucket) — see commands below.
2. Go to https://vercel.com/new → "Import Git Repository" → pick your repo.
3. Vercel auto-detects Next.js. Leave build settings as-is.
4. **Environment Variables** — paste every value from your `.env.local` (see the full list below). Vercel will inject them at build + runtime.
5. Click **Deploy**. ~2 minutes later you'll have a `https://your-project.vercel.app` URL.
6. After first deploy:
   - Add that URL to `NEXT_PUBLIC_SITE_URL` and re-deploy
   - Add the URL to the Google Maps API key's allowed HTTP referrers
   - Add the URL to Supabase Auth → URL Configuration → Site URL + redirect URLs
   - Swap Razorpay test keys for live keys when ready

## Path B — via the Vercel CLI

```bash
# 1. push to GitHub first (or skip — `vercel` can deploy without a remote)
vercel login                # interactive — opens a browser
vercel link                 # links this folder to a Vercel project
vercel env add              # adds env vars one at a time (or use the dashboard)
vercel --prod               # deploys to production
```

## Environment variables to set in Vercel

Copy these names exactly. Values come from `.env.local`.

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

NEXT_PUBLIC_SITE_URL                  # https://your-project.vercel.app
STORE_NAME

NEXT_PUBLIC_STORE_LATITUDE
NEXT_PUBLIC_STORE_LONGITUDE
NEXT_PUBLIC_STORE_STATE

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

NEXT_PUBLIC_RAZORPAY_KEY_ID
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET

GMAIL_USER
GMAIL_APP_PASSWORD

TELEGRAM_BOT_TOKEN
TELEGRAM_ADMIN_CHAT_ID
```

## Pushing to GitHub (one-time)

```bash
# create an empty repo at https://github.com/new (don't add a README)
# then in this folder:
git remote add origin https://github.com/YOUR_USERNAME/radharani-collection.git
git push -u origin main
```

## Post-deploy checklist

- [ ] All 3 Supabase migrations applied (`00001_init.sql`, `00002_features.sql`, `00003_cart_sync.sql`)
- [ ] `NEXT_PUBLIC_SITE_URL` set to the production URL
- [ ] Google Maps API key restricted to production referrer
- [ ] Supabase Auth → "Site URL" set to production URL; "Redirect URLs" includes `https://yourdomain/auth/callback`
- [ ] At least one admin user promoted (`update profiles set is_admin=true where id=...`)
- [ ] Razorpay live keys swapped in (when going live)
- [ ] Test order placed end-to-end on the deployed URL
