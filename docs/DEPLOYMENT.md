# ArcadeForge Hub — Deployment Guide

This guide walks you through deploying the ArcadeForge Hub (the community game gallery) and connecting the CLI to it. No prior deployment experience required.

---

## 1. Supabase Setup (Database & Storage)

Supabase provides the database for game listings, ratings, and file storage.

### Create a Project

1. Go to [supabase.com](https://supabase.com) and sign up or log in.
2. Click **New Project**.
3. Choose an organization (or create one), give your project a name (e.g. `arcadeforge-hub`), set a database password, and pick a region close to your users.
4. Wait for the project to finish provisioning (about 1 minute).

### Run the Database Schema

1. In the Supabase dashboard, go to **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open `hub/supabase/schema.sql` from this repo and paste the entire contents into the editor.
4. Click **Run**. You should see "Success. No rows returned."

This creates two tables (`games` and `ratings`) and configures Row Level Security policies so that:
- Anyone can read approved games and all ratings.
- Anyone can submit a game (starts as `pending`).
- Only the service role (admin) can update game status.

### Copy Your API Credentials

1. Go to **Settings > API** (under "Project Settings" in the sidebar).
2. Copy these two values and save them — you will need them for Vercel:
   - **Project URL** (e.g. `https://abcdefgh.supabase.co`)
   - **anon / public** key (the long `eyJ...` string)

### Set Up Storage (Optional — for Game File Hosting)

If you want users to upload game files directly to Supabase Storage:

1. Go to **Storage** in the sidebar.
2. Click **New bucket**.
3. Name it `games`.
4. Toggle **Public bucket** to ON (so game files are publicly accessible).
5. Click **Create bucket**.

---

## 2. Deploy to Vercel

Vercel is the recommended host for the Next.js hub application.

### Push to GitHub

If you have not already, push the ArcadeForge repo to GitHub:

```bash
git remote add origin https://github.com/YOUR_USERNAME/arcadeforge.git
git push -u origin main
```

### Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up or log in (GitHub sign-in is easiest).
2. Click **Add New... > Project**.
3. Select your `arcadeforge` repository from the list.
4. Configure the build settings:
   - **Root Directory:** `hub`
   - **Framework Preset:** Next.js (should auto-detect)
   - Leave Build Command and Output Directory as defaults.

### Add Environment Variables

Before clicking Deploy, expand **Environment Variables** and add these four:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `ADMIN_PASSWORD` | A strong password for the admin panel |
| `NEXT_PUBLIC_SITE_URL` | Your Vercel URL (e.g. `https://arcadeforge-hub.vercel.app`) |

> **Tip:** You can set `NEXT_PUBLIC_SITE_URL` to a placeholder first, then update it after you know your Vercel URL.

### Deploy

Click **Deploy**. Vercel will build and deploy the hub. Once finished, you will get a URL like `https://arcadeforge-hub.vercel.app`.

### Custom Domain (Optional)

1. In your Vercel project dashboard, go to **Settings > Domains**.
2. Add your custom domain and follow the DNS configuration instructions.
3. Update `NEXT_PUBLIC_SITE_URL` in Vercel environment variables to match your custom domain.
4. Redeploy (or Vercel will auto-redeploy on the next push).

---

## 3. Post-Deploy Verification

After deploying, walk through this checklist to make sure everything works:

- [ ] **Homepage loads** — Visit your Vercel URL and confirm the gallery page renders.
- [ ] **No console errors** — Open browser DevTools (F12) and check the Console tab.
- [ ] **Game detail page** — If any games exist, click one and verify the detail page loads.
- [ ] **Game submission** — Use the CLI `arcadeforge deploy` command (or submit via API) and confirm it shows as pending.
- [ ] **Admin login** — Go to `/admin/login` and log in with your `ADMIN_PASSWORD`.
- [ ] **Admin moderation** — In the admin panel, approve or reject a pending game.
- [ ] **Approved game visible** — After approving, confirm the game appears on the public homepage.
- [ ] **Ratings work** — On a game detail page, submit a rating and verify it saves.
- [ ] **Search/filtering** — If your hub has search or genre filters, test that they return correct results.

---

## 4. CLI Configuration

By default, the CLI deploy command submits games to `https://arcadeforge-hub.vercel.app/api/submit`. To point it at your own hub:

### Option A: Environment Variable (Recommended)

Set the `ARCADEFORGE_HUB_URL` environment variable to your hub's submit endpoint:

```bash
# Add to your shell profile (~/.bashrc, ~/.zshrc, etc.)
export ARCADEFORGE_HUB_URL="https://your-hub-domain.vercel.app/api/submit"
```

Then reload your shell:

```bash
source ~/.bashrc   # or source ~/.zshrc
```

### Option B: Edit the Default

If you want all users of your fork to use your hub by default, update the fallback URL in `cli/src/deploy.ts`:

```typescript
const HUB_API_URL = process.env.ARCADEFORGE_HUB_URL || 'https://your-hub-domain.vercel.app/api/submit';
```

Then rebuild the CLI:

```bash
npm run build:cli
```

---

## 5. Publishing the CLI to npm (Optional)

Publishing to npm lets anyone create games with `npx arcadeforge create` without cloning the repo.

### Prerequisites

- An [npm account](https://www.npmjs.com/signup).
- The CLI builds successfully (`npm run build:cli`).

### Publish Steps

```bash
# 1. Log in to npm
npm login

# 2. Build the CLI (from the repo root)
npm run build:cli

# 3. Navigate to the CLI package
cd cli

# 4. Do a dry run first to verify what will be published
npm publish --dry-run

# 5. Publish for real
npm publish

# 6. Go back to the repo root
cd ..
```

### Verify the Published Package

From a clean directory (not inside the repo):

```bash
npx arcadeforge create
```

This should download the package and start the game creation wizard.

### Updating the Published Version

When you release updates:

```bash
# Bump version (patch/minor/major)
cd cli
npm version patch
cd ..

# Rebuild and publish
npm run build:cli
cd cli && npm publish && cd ..
```

---

## 6. Ongoing Maintenance

### Automatic Deployments

By default, Vercel auto-deploys whenever you push to the `main` branch. No manual intervention needed for hub updates.

### Supabase Monitoring

- Check the **Database** section in Supabase to monitor table sizes and row counts.
- The free tier includes 500 MB database storage and 1 GB file storage — more than enough to start.
- View API request logs under **Edge Functions > Logs** or the **API** section.

### Database Backups

- Supabase automatically creates daily backups on paid plans.
- On the free tier, you can manually export data:
  ```bash
  # If you have the Supabase CLI installed
  supabase db dump --project-ref YOUR_PROJECT_REF > backup.sql
  ```
- Alternatively, export from the dashboard: **Database > Backups**.

### Scaling

- **Supabase:** Upgrade to a paid plan if you exceed free tier limits (500 MB DB, 1 GB storage, 50K monthly active users).
- **Vercel:** The free Hobby plan handles most traffic. Upgrade to Pro for higher bandwidth or team features.

### Security Reminders

- Rotate your `ADMIN_PASSWORD` periodically by updating the environment variable in Vercel.
- Never commit `.env.local` to version control. The `.gitignore` should already exclude it.
- The Supabase anon key is safe to expose client-side — RLS policies protect the data.
