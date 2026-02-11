# ArcadeForge Hub

The community platform for ArcadeForge -- browse, play, and rate games created by the community.

Built with Next.js 14 (App Router), Supabase, and Tailwind CSS.

## Local Development

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works fine)

### Setup

1. Install dependencies from the repo root:

```bash
npm install
```

2. Copy the environment template:

```bash
cp hub/.env.local.example hub/.env.local
```

3. Fill in your Supabase credentials in `hub/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ADMIN_PASSWORD=a-strong-password-for-moderation
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Start the dev server:

```bash
npm run dev:hub
```

The Hub will be available at `http://localhost:3000`.

## Supabase Setup

Create a new Supabase project at [supabase.com](https://supabase.com), then run the following SQL in the Supabase SQL Editor to create the required table:

```sql
create table games (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  genre text not null,
  vibe text,
  description text,
  snapshot jsonb not null,
  bundle text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table games enable row level security;

-- Public read access for approved games
create policy "Anyone can view approved games"
  on games for select
  using (status = 'approved');

-- Anyone can submit (insert) a game
create policy "Anyone can submit a game"
  on games for insert
  with check (true);
```

Copy your project URL and anon key from Settings > API into your `.env.local` file.

## Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous/public key. |
| `ADMIN_PASSWORD` | Yes | Password for the `/admin` moderation panel. |
| `NEXT_PUBLIC_SITE_URL` | No | Site URL for Open Graph metadata. Defaults to `http://localhost:3000`. |

## Pages

| Route | Description |
| :--- | :--- |
| `/` | Homepage -- browse approved games. |
| `/games/[id]` | Individual game page with embedded player. |
| `/submit` | Game submission form (used by `arcadeforge deploy`). |
| `/admin` | Moderation panel (requires admin password). |

## Deploying to Vercel

1. Push the repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Set the **Root Directory** to `hub`.
4. Add all environment variables from `.env.local` to the Vercel project settings.
5. Deploy. Vercel auto-detects Next.js and handles the rest.

The CLI's `arcadeforge deploy` command submits games to the Hub's `/api/submit` endpoint. Set `ARCADEFORGE_HUB_URL` in the root `.env` to point to your production URL (e.g., `https://your-hub.vercel.app/api/submit`).
