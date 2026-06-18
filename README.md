# VibeMatch

VibeMatch is a social movie-picking app for friends, partners, roommates, and groups who want to stop endlessly scrolling and actually find something they all want to watch.

The v1 MVP focuses on movies, US streaming availability, friends and partners, two-person sessions, async swiping, live timed sessions, and a lightweight vibe check before swiping. Future slices can add country switching, shows, books, recipes, games, richer recommendations, personal ratings, and watched-together ratings.

## First milestone

Two users can join a VibeMatch session, answer a vibe check, swipe US-available movies, and see shared matches with basic movie details:

- Title, poster art, description, runtime, release year, genres, and ratings
- US watch availability for streaming, rent, and buy providers
- Provider freshness using `last_checked_at`
- Private like or skip actions
- Perfect matches, almost matches, and no-match recovery options

## Current implementation

This repo currently contains a polished prototype shell built with mock movie/session data plus the first real Supabase Auth slice for email/password signup, login, signout, callback handling, cookie refresh, and a protected app dashboard. TMDB and OMDb integration are intentionally deferred until the app flow is validated.

The mock domain model covers:

- `profiles`
- `friendships`
- `media_items`
- `movie_ratings`
- `watch_providers`
- `swipes`
- `matches`
- `sessions`
- `session_filters`
- `watched_together`

## Figma

The first design pass lives in:

https://www.figma.com/design/kJktYujehpxaF0fxFif8ia

It includes editable mobile-first frames for landing, auth, dashboard, vibe check, live session setup, swipe, movie details, match results, and design notes.

## Development

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Useful checks:

```bash
npm run lint
npm run build
```

## Supabase Auth

Create `.env.local` from `.env.example` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
```

For hosted Supabase projects, email/password auth is enabled by default. If email confirmations are on, add this redirect URL in Supabase Auth settings:

```text
http://localhost:3000/auth/callback
```

The app includes `/signup`, `/login`, `/auth/callback`, social OAuth buttons, and protected `/app` routes.

### Google and GitHub OAuth

The app-side code is already wired:

- `/login` and `/signup` post the Google and GitHub buttons to Supabase OAuth server actions.
- `/auth/callback` exchanges the Supabase OAuth code for a session cookie.
- `NEXT_PUBLIC_APP_URL` controls the fallback callback origin. On Vercel, the code can also fall back to `NEXT_PUBLIC_VERCEL_URL` or `VERCEL_URL`.

There are two different callback URL concepts:

1. OAuth provider callback, used by Google/GitHub to return to Supabase:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

Copy this from Supabase Dashboard > Authentication > Sign In / Providers > Google or GitHub.

2. App redirect URL, used by Supabase to return to VibeMatch:

```text
http://localhost:3000/auth/callback
https://your-production-domain.com/auth/callback
```

Add those in Supabase Dashboard > Authentication > URL Configuration > Redirect URLs. For Vercel preview deployments, add a preview wildcard such as:

```text
https://*-<team-or-account-slug>.vercel.app/**
```

Google setup:

1. In Google Cloud Console, create an OAuth Client ID with application type `Web application`.
2. Add Authorized JavaScript origins:

```text
http://localhost:3000
https://your-production-domain.com
```

3. Add Authorized redirect URIs:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

4. Save the Google Client ID and Client Secret into Supabase Dashboard > Authentication > Sign In / Providers > Google, then enable the provider.

GitHub setup:

1. In GitHub Developer Settings > OAuth Apps, register a new OAuth app.
2. Set Homepage URL to your app URL, such as `http://localhost:3000` for local testing or your production domain.
3. Set Authorization callback URL to:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

4. Save the GitHub Client ID and Client Secret into Supabase Dashboard > Authentication > Sign In / Providers > GitHub, then enable the provider.

Do not put Google or GitHub client secrets in `.env.local`. Supabase stores those provider credentials.

## Vercel

This project includes a typed `vercel.ts` project configuration for Vercel:

- Framework preset: `nextjs`
- Install command: `npm install`
- Build command: `npm run build`

Install the Vercel CLI before using the Vercel scripts:

```bash
npm i -g vercel
```

Then link the project and pull preview project settings:

```bash
npm run vercel:link
npm run vercel:pull
```

Pull local development variables when the Vercel project has env vars configured:

```bash
npm run vercel:env
```

Deployment helpers:

```bash
npm run vercel:build
npm run vercel:deploy
npm run vercel:deploy:prod
```

Use `.env.example` as the local/Vercel environment contract. For the next API slice, set Supabase, TMDB, and OMDb variables in Vercel Project Settings, then pull them locally with `npm run vercel:env`.
