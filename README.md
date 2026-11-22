# ChessHost ♟

Chess tournament hosting app — React + Vite + TypeScript + Supabase, with the dark chess.com-style UI.

**Features:** organiser accounts · create tournaments (Swiss / Round Robin / Knockout) · QR + link self-registration · saved player roster (CSV import) · auto pairings · result entry · live standings (Buchholz tie-break) · realtime TV display (Casual / Esports / Kids) · downloadable PNG/PDF certificates · Free/Pro plan limits.

## Setup (5 minutes)

1. **Create a Supabase project** at https://supabase.com
2. **Run the schema:** Dashboard → SQL Editor → New query → paste all of `supabase/schema.sql` → Run
3. **Add your keys:** copy `.env.example` to `.env` and fill in (Dashboard → Project Settings → API)
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
4. **Install & run**
   ```bash
   npm install
   npm run dev
   ```
5. **While developing:** Dashboard → Authentication → Providers → Email → turn **off** "Confirm email" so sign-ups log in instantly.

## Make yourself Pro (removes the 1-event/month and 12-player limits)

Users can't change their own plan. Run this in the SQL editor:

```sql
update public.profiles set plan = 'pro' where email = 'you@example.com';
```

## Routes

| Route | Who | What |
|---|---|---|
| `/login` | public | Sign in / create account |
| `/join/:slug` | public | Player self-registration (the QR code points here) |
| `/tv/:slug` | public | Full-screen live TV display (realtime) |
| `/tournaments` | organiser | Dashboard, create, invite, edit players, certificates |
| `/tournaments/:id` | organiser | Control room: pairings, results, next round |
| `/tournaments/:id/standings` | organiser | Full standings |
| `/tournaments/:id/tv` | organiser | TV preview, theme picker, full screen |
| `/players` | organiser | Saved roster, import CSV/TXT |
| `/billing`, `/settings` | organiser | Plans, profile |

## How tournaments work

- **Swiss:** round 1 splits the seed list top-half vs bottom-half; later rounds pair by points, avoid rematches, balance colours, and give the bye to the lowest-ranked player who hasn't had one.
- **Round Robin:** circle method, every player meets every other once; odd player counts rotate the bye.
- **Knockout:** top seeds get byes to fill the bracket; winners advance; draws are disabled.
- Scoring: win 1, draw ½, bye 1. Tie-break: Buchholz → wins → name.
- Players are locked once a tournament starts. "Next round" unlocks when every result is in; the last round becomes "Finish tournament".

## Security notes

- Row Level Security is on for every table. Organisers only write to their own data.
- `tournaments`, `players` and `games` are **publicly readable** on purpose (the TV display and join page work without login). Don't put sensitive info in player names.
- Public sign-up goes through the `join_tournament()` function, which checks that registration is open and enforces name rules and the Free-plan player cap.
- Plan limits are enforced by database triggers, not just the UI.

## Deploy

```bash
npm run build      # outputs dist/
```
Works on Vercel / Netlify / Cloudflare Pages (SPA rewrites included: `vercel.json`, `public/_redirects`).
Set the two `VITE_` env vars in the host, then add your deployed URL under Supabase → Authentication → URL Configuration (Site URL + Redirect URLs).

## Not wired up yet

- **Payments:** "Upgrade to Pro" shows a placeholder modal. Hook it to M-Pesa/Stripe and have your webhook set `profiles.plan = 'pro'`.
- **AI rules assistant** (listed on the Pro card) is marketing copy only.
- The control-room board is a decorative preview. Players play on their own boards (chess.com, OTB, etc.); you record the results.
