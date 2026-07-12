# PROJECT_MEMORY — ShuttleTracker

## Current Phase

Active development. Major feature sprint complete 2026-07-12. All features deployed to Vercel + Neon PostgreSQL.

## Completed Phases

- PWA foundation (Next.js 14, Prisma, Neon PostgreSQL, Google OAuth)
- Equipment tracking (rackets, shuttles, stringing records)
- Session tracking + player analytics
- Multi-user with Google OAuth
- Vercel deployment pipeline
- Recurring Costs (club/coaching subscriptions, monthly/annual billing, Coaching session type, amortized in analytics + dashboard)
- Sub-Profiles (Player model, per-player equipment/sessions/analytics, sidebar switcher, cookie-based active player, `playerId: null` = owner)
- Player Assignment (explicit PlayerPicker on all create + edit dialogs, retroactive reassignment, batch reassignment via /reassign page)

## Active Backlog

- getLastSession() in sessions form pre-fill is not player-scoped — racket pre-selection falls back to player's first racket gracefully. No data integrity issue; UX polish backlog.

## Deferred

- Offline PWA support (service worker caching) — not yet implemented
- Advanced analytics / trend views — no demand yet

## Locked Decisions

- **`requireAuth()` always, never `getServerSession()`** — internal HTTP calls unreliable on Vercel serverless.
- **Server Actions pattern:** every action returns a result object. Never throw — errors are stripped in production builds.
- **`DATABASE_URL` for pooled connections (pgbouncer), `DIRECT_URL` for migrations only.**
- **`ADMIN_EMAIL` env var gates admin access** — single admin model.
- **All mutations go through `"use server"` functions only** — no direct DB calls from client components.
- **`playerId: null` = owner's own record.** `undefined` in a query = no filter (all). `null` in a query = unassigned only. Conditional spread `...(playerId !== undefined && { playerId })` used throughout.
- **verifyPlayerOwnership** must be called before any DB write that accepts a client-provided `playerId`. Internal helper, not exported.
- **Active player stored in `localStorage` + `shuttletrack-player` cookie (Secure; SameSite=Lax).** Server reads the cookie; ownership verified server-side on every request.
- **getRecurringCosts sentinel:** `undefined` = all costs (dashboard); `null` = unassigned only; `string` = player-scoped (costs page).

## Observation Notes

<!-- Append-only. One dated block per day during any active observation window. -->

2026-06-24
- PROJECT_MEMORY stub created. Active maintenance mode; core features deployed.

2026-07-12
- Major feature sprint: Recurring Costs, Sub-Profiles, Player Assignment, Batch Reassignment all shipped in one session.
- Bug fixed: stringing Active badge was driven by insertion order, not date order. Fixed in getStringings() (derive isActive from date) + createStringing() (only take Active if new date >= current active).
- TypeScript error found and fixed: duplicate `const now` in getAnalyticsData().
- Two regressions caught by final reviewer before merge: (1) getRecurringCosts defaulting to playerId: null broke dashboard totals — fixed with undefined=all sentinel; (2) deletePlayer missing recurringCosts in guard would 500 — fixed.

## Next Review Gate

User-reported bug or feature request triggers next session.
