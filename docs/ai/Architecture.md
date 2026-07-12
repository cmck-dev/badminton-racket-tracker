# ShuttleTracker — Architecture

## What It Is

PWA for tracking badminton equipment (rackets, shuttles), play sessions, stringing records, recurring costs (club/coaching), and player analytics. Multi-user with Google OAuth. Supports sub-profiles (multiple players per account). Production: `https://project-90dmh.vercel.app`

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 App Router |
| Database | Neon PostgreSQL (serverless) |
| ORM | Prisma 6 |
| Auth | NextAuth v4 — Google OAuth, database sessions |
| Deployment | Vercel |
| Styling | Tailwind CSS + Radix UI (`src/components/ui/`) |
| Testing | Vitest |

## Request Flow

```
Browser request
  → Middleware (src/middleware.ts) — cookie presence check → redirect if missing
    → page.tsx (Server Component) — requireAuth() + getActivePlayerId() → full session + player validation
      → Server Actions — auth + userId + playerId scoped DB queries → return typed data
        → client.tsx (Client Component) — interactivity + mutations
```

## Auth Architecture

**Three layers:**
1. **Middleware** (`src/middleware.ts`) — fast cookie check; redirects unauthenticated to `/auth/signin`. Excludes `/auth/**`, `/api/auth/**`, static assets.
2. **`requireAuth()`** (`src/lib/session.ts`) — deep validation: queries Prisma for session record, returns `user + isAdmin`. Used in every protected page/action.
3. **`requireAdmin()`** — wraps `requireAuth()`, checks `user.email === ADMIN_EMAIL`.

## Server Actions (`src/lib/actions.ts`)

All mutations are `"use server"` functions. Every action:
1. Calls `requireAuth()` to validate session
2. Scopes DB queries to `userId` — never trusts client-provided IDs
3. Returns a typed result object — never throws (errors are stripped in Next.js production builds)

## Sub-Profile (Player) System

One Google account can own multiple `Player` sub-profiles. Every equipment/session model has a nullable `playerId` FK:

- `playerId = null` → owner's own record (pre-profile data or deliberately assigned to "Me")
- `playerId = <cuid>` → belongs to a named sub-profile

**Active player selection:** stored in `localStorage` + `shuttletrack-player` cookie (Secure; SameSite=Lax). Server reads the cookie via `getActivePlayerId()` which verifies ownership before returning the ID.

**`verifyPlayerOwnership(playerId, userId)`** — internal helper called before any DB write that accepts a client-provided `playerId`. Prevents cross-user player injection.

**`getRecurringCosts` sentinel:** `undefined` arg = all costs (no filter); `null` = unassigned only; `string` = player-scoped.

**Shared component:** `src/components/player-picker.tsx` — a Select that maps `""` ↔ null (Me) and renders nothing when no sub-profiles exist.

## Token Encryption

OAuth tokens encrypted at rest with AES-256-GCM (`src/lib/token-crypto.ts`). `EncryptedPrismaAdapter` (`src/lib/encrypted-adapter.ts`) wraps the Prisma adapter to transparently encrypt on write and decrypt on read.

## Database

**Two connection strings required:**
- `DATABASE_URL` — pooled (pgbouncer) for runtime queries
- `DIRECT_URL` — direct connection for migrations (pgbouncer breaks DDL)

## Currency System

Currency preference on `PlayerProfile.currency`. Fixed exchange rates in `src/lib/currency.ts`. `<CurrencyAmount>` formats with locale-aware notation (INR uses Indian numbering).

## Recurring Cost System

`RecurringCost` model: type (Club | Coaching | Other), billingCycle (Monthly | Annual), amount, startDate, endDate?. Amortized total (full periods elapsed × amount) is included in `getAnalyticsData()` and the dashboard investment card.

## Key Files

| Purpose | Path |
|---|---|
| Auth config | `src/lib/auth.ts` |
| Auth/admin helpers | `src/lib/session.ts` |
| All Server Actions | `src/lib/actions.ts` |
| Prisma client | `src/lib/db.ts` |
| Token encryption | `src/lib/token-crypto.ts` |
| Encrypted adapter | `src/lib/encrypted-adapter.ts` |
| Schema | `prisma/schema.prisma` |
| Middleware | `src/middleware.ts` |
| Currency logic | `src/lib/currency.ts` |
| Player picker (shared) | `src/components/player-picker.tsx` |
| Player context | `src/contexts/player-context.tsx` |
