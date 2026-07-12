# ShuttleTracker — Security

## Threat Model

| Asset | Threat | Mitigation |
|---|---|---|
| User equipment and session data | Unauthorised access | NextAuth v4 database sessions; `requireAuth()` on every protected route |
| OAuth tokens | At-rest exposure | AES-256-GCM encrypted via `EncryptedPrismaAdapter` |
| User data isolation | Cross-user data access | All DB queries scoped to `userId` from server-side session |
| Sub-profile data isolation | Cross-player data access within an account | `verifyPlayerOwnership()` called before every player-scoped DB write; `getActivePlayerId()` validates cookie server-side |
| Admin functions | Privilege escalation | `ADMIN_EMAIL` env var; `requireAdmin()` gate on every admin route |

## Auth Approach

**Defence in depth — three layers:**

1. **Middleware** — fast pre-filter; redirects unauthenticated requests. Not a security boundary (can be bypassed by direct API calls).
2. **`requireAuth()`** — deep validation on every protected page and Server Action. Source of truth.
3. **`requireAdmin()`** — additional admin gate wrapping `requireAuth()`.

**Critical:** Middleware alone is insufficient. Every page and Server Action must independently validate the session via `requireAuth()`.

## Token Encryption

- AES-256-GCM with per-record IV and auth tag
- Wire format: `iv:authTag:ciphertext` (base64) — backwards-compatible with plaintext tokens
- `TOKEN_ENCRYPTION_KEY` = 64-char hex (32 bytes) generated with `openssl rand -hex 32`
- Key stored in environment variable only — never in DB or source

## Data Scoping Rules

**`userId` scope:** All DB queries must use `userId` from the server-side session. Never use `userId` from request body, query params, or client input — always re-derive from `requireAuth()`.

**`playerId` scope:** When a client-provided `playerId` is accepted by a Server Action, `verifyPlayerOwnership(playerId, userId)` must be called first. A forged or tampered player ID is silently rejected — never leaks another user's data.

**Player cookie:** `shuttletrack-player` cookie holds the active sub-profile ID. Server reads it via `getActivePlayerId()` which calls `verifyPlayerOwnership` before returning. A tampered value falls back to `null` (owner view).

## GDPR Considerations

- Users can be identified by email (Google OAuth)
- No sensitive financial or health data — equipment and session logs are low-sensitivity
- Delete flow cascades: user → profiles → equipment → sessions → sub-profiles
- Sub-profile deletion blocked if the player has any associated records — user must reassign or delete records first
- No third-party analytics or tracking scripts

## Infrastructure

- Deployed on Vercel — no server management; Vercel's security model applies
- Database on Neon (serverless PostgreSQL) — encrypted at rest by default
- Secrets managed via Vercel environment variables — never committed to source
