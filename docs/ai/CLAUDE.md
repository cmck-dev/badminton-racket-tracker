# ShuttleTracker — Project CLAUDE.md

## Commands

```bash
npm run dev               # Start dev server
npm run build             # Production build
npm run lint              # ESLint check

npm test                  # Run tests once
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report

npm run db:generate       # Regenerate Prisma client after schema changes
npm run db:push           # Push schema changes (no migration file)
npm run db:migrate        # Create + apply migration
npm run db:seed           # Seed DB from prisma/seed.ts
npm run db:studio         # Open Prisma Studio GUI
```

Run a single test: `npx vitest run src/lib/currency.test.ts`

## Architecture

Next.js 14 App Router + Prisma 6 + Neon PostgreSQL + NextAuth v4 (Google OAuth). Deployed on Vercel.

Every route follows the SSR + client split:
- `app/<route>/page.tsx` — server component; calls `requireAuth()` + `getActivePlayerId()`, fetches data via Server Actions, passes to client
- `app/<route>/client.tsx` — client component; handles interactivity via Server Actions

**Never use `getServerSession()`** — it makes internal HTTP calls unreliable on Vercel serverless. Always use `requireAuth()` from `src/lib/session.ts`.

See `docs/ai/Architecture.md` for full system design.

## Environment Variables

```
DATABASE_URL          # Neon pooled URL (pgbouncer) — runtime
DIRECT_URL            # Neon direct URL — migrations only
NEXTAUTH_URL          # Must match deployment URL exactly
NEXTAUTH_SECRET       # openssl rand -base64 32
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
TOKEN_ENCRYPTION_KEY  # openssl rand -hex 32 (64-char hex)
ADMIN_EMAIL           # Grants admin access (optional)
```

## Invariants

- **Never bypass `requireAuth()`** — middleware is a fast pre-filter only, not a security boundary
- **All DB queries scoped to `userId`** from server-side session — never trust client-provided user IDs
- **Schema changes require `db:generate`** — Prisma client is not auto-regenerated during `dev`
- **`DIRECT_URL` required for migrations** — pgbouncer pooling breaks DDL
- **Token encryption is backwards-compatible** — `token-crypto.ts` handles plaintext tokens; do not change the `iv:authTag:ciphertext` wire format
- **Server Actions must return result objects, never throw** — errors are stripped in Next.js production builds
- **`playerId: null` = owner's own record.** `undefined` in a query = no filter (all records). `null` in a query = unassigned only. Conditional spread `...(playerId !== undefined && { playerId })` used in all update actions.
- **`verifyPlayerOwnership(playerId, userId)` must be called** before any DB write that accepts a client-provided `playerId`
- **`getRecurringCosts` sentinel:** `undefined` = all; `null` = unassigned only; `string` = player-scoped
