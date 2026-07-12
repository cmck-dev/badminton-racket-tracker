# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**ShuttleTrack** — a PWA for tracking badminton equipment (rackets, shuttles), play sessions, stringing records, recurring costs (club/coaching subscriptions), and player analytics. Supports multiple player sub-profiles per account. Multi-user, Google OAuth, deployed on Vercel + Neon PostgreSQL.

Production URL: `https://project-90dmh.vercel.app`

---

## Commands

```bash
# Development
npm run dev               # Start dev server
npm run build             # Production build
npm run lint              # ESLint check

# Testing
npm test                  # Run tests once
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report

# Database
npm run db:generate       # Regenerate Prisma client after schema changes
npm run db:push           # Push schema changes (no migration file)
npm run db:migrate        # Create + apply migration
npm run db:seed           # Seed DB from prisma/seed.ts
npm run db:studio         # Open Prisma Studio GUI
```

Run a single test file: `npx vitest run src/lib/currency.test.ts`

---

## Architecture

### Stack
- **Next.js 14 App Router** — SSR pages + React Server Components + Server Actions
- **Prisma 6 + Neon PostgreSQL** — `DATABASE_URL` for pooled connections (pgbouncer), `DIRECT_URL` for migrations
- **NextAuth v4** — Google OAuth with database sessions (not JWT); Prisma adapter
- **Tailwind CSS + Radix UI** — design system in `src/components/ui/`
- **Vitest** — unit tests in `src/lib/*.test.ts`

### Page Pattern
Every route follows the SSR + client split:
- `app/<route>/page.tsx` — server component; calls `requireAuth()` or `requireAdmin()`, fetches initial data via Server Actions, passes to client
- `app/<route>/client.tsx` — client component; handles all interactivity and mutations via Server Actions

### Auth Flow
1. **Middleware** (`src/middleware.ts`) — fast cookie-presence check; redirects unauthenticated requests to `/auth/signin`. Excludes `/auth/**`, `/api/auth/**`, static assets.
2. **`requireAuth()`** (`src/lib/session.ts`) — deep validation: queries Prisma directly for the session record, returns user + `isAdmin` flag. Used in every protected page/action.
3. **`requireAdmin()`** — wraps `requireAuth()` and checks `user.email === process.env.ADMIN_EMAIL`.

> `getServerSession()` is intentionally not used — it makes internal HTTP calls that are unreliable on Vercel serverless. Always use `requireAuth()` instead.

### Sub-Profile System
One Google account can own multiple `Player` sub-profiles. Every equipment/session model has a nullable `playerId` FK (`null` = owner's own record). The active player is stored in a `shuttletrack-player` cookie read server-side via `getActivePlayerId()`. `verifyPlayerOwnership()` is called before every DB write that accepts a client-provided `playerId`.

### Server Actions (`src/lib/actions.ts`)
All mutations go through `"use server"` functions. Every action:
1. Calls `requireAuth()` to validate the session
2. Scopes DB queries to `userId` — never trusts client-provided user IDs
3. Returns typed data or a result object — **never throws** (errors are stripped in production builds)
4. Calls `verifyPlayerOwnership()` when a `playerId` is provided

### Token Encryption
OAuth access/refresh tokens are encrypted at rest with AES-256-GCM (`src/lib/token-crypto.ts`). The `EncryptedPrismaAdapter` (`src/lib/encrypted-adapter.ts`) wraps the standard Prisma adapter to transparently encrypt on write and decrypt on read. Requires `TOKEN_ENCRYPTION_KEY` (64-char hex, 32 bytes).

### Currency System
Currency preference is stored on `PlayerProfile.preferredCurrency` and hydrated into `CurrencyContext` on the client. Fixed exchange rates relative to USD are in `src/lib/currency.ts`. The `<CurrencyAmount>` component formats values with locale-aware notation (e.g. Indian numbering for INR).

### Admin System
`ADMIN_EMAIL` env var designates a single admin. Admin users see an extra section in the sidebar and can access `/admin` (aggregated stats, feedback management). No role column in DB — purely env-based.

---

## Key Files

| Purpose | Path |
|---|---|
| Auth config (NextAuth options) | `src/lib/auth.ts` |
| Auth/admin helpers | `src/lib/session.ts` |
| All Server Actions | `src/lib/actions.ts` |
| Prisma client singleton | `src/lib/db.ts` |
| Token encryption | `src/lib/token-crypto.ts` |
| Encrypted Prisma adapter | `src/lib/encrypted-adapter.ts` |
| Database schema | `prisma/schema.prisma` |
| Middleware | `src/middleware.ts` |
| Currency logic | `src/lib/currency.ts` |
| Player picker (shared) | `src/components/player-picker.tsx` |
| Player context (active player) | `src/contexts/player-context.tsx` |
| Root layout + providers | `src/app/layout.tsx`, `src/components/providers.tsx` |

---

## Environment Variables

```
DATABASE_URL          # Neon pooled URL (pgbouncer) — used at runtime
DIRECT_URL            # Neon direct URL — used for migrations only
NEXTAUTH_URL          # Must match deployment URL exactly
NEXTAUTH_SECRET       # openssl rand -base64 32
GOOGLE_CLIENT_ID      # Google OAuth
GOOGLE_CLIENT_SECRET  # Google OAuth
TOKEN_ENCRYPTION_KEY  # openssl rand -hex 32 (64-char hex)
ADMIN_EMAIL           # Email address granted admin access (optional)
```

---

## Invariants

- **Never bypass `requireAuth()`** — middleware is a fast pre-filter only, not a security boundary.
- **All DB queries must be scoped to `userId`** from the server-side session, never from client input.
- **Schema changes require `db:generate`** — Prisma client is not auto-regenerated during `dev`.
- **`DIRECT_URL` is required for migrations** — pgbouncer pooling breaks DDL statements.
- **Token encryption is backwards-compatible** — `token-crypto.ts` handles plaintext tokens gracefully; do not change the `iv:authTag:ciphertext` format.
- **Server Actions must return result objects, never throw** — errors are stripped in Next.js production builds.
- **`playerId: null` = owner's own record.** `undefined` in a where clause = no filter (all records). Conditional spread `...(playerId !== undefined && { playerId })` used in all update actions.
- **`verifyPlayerOwnership(playerId, userId)` must be called** before any DB write that accepts a client-provided `playerId`.
- **`getRecurringCosts` sentinel:** `undefined` = all costs; `null` = unassigned only; `string` = player-scoped.
