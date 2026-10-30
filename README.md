# Rotta

Rebuild of [rotta.mt](https://rotta.mt) on Next.js, Supabase and Vercel. See [CLAUDE.md](CLAUDE.md) for the plan and decisions.

```bash
cp .env.example .env.local   # then fill in the values
pnpm install
pnpm dev
```

## Daily Supabase heartbeat

Vercel Cron calls `/api/cron/heartbeat/` daily at 08:00 UTC. It uses the existing server-only `CRON_SECRET` bearer token and reads one published page ID from Rotta's Supabase project (`wdctbixfjvwbvqlylpuf`) using the anonymous public client. It never writes data or calls checkout/payment code.

The endpoint returns 200 only for a successful nonempty database result, 401 for missing/invalid authentication, and 503 for database failures or a 10-second query timeout. Responses are no-store and noindex. This schedule runs on Vercel without Codex or a local computer; the existing checkout-maintenance cron stays at 03:17 UTC. Daily requests reduce inactivity risk but do not guarantee that a free Supabase project will never pause.
