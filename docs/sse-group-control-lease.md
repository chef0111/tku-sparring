# SSE: Tournament selection sync (match claims)

This document replaces the obsolete **group control lease** SSE design. Coordinating Advance Settings across devices is driven by **`ArenaMatchClaim`** (per-match TTL locks), not group-wide leases.

## Goals

- Push match-claim related invalidations without WebSockets for multiple arenas/devices.
- One stream per authenticated user session per tournament.
- Keep client logic thin: SSE signals “refetch Advance selection”; data still comes from oRPC.

## Stream

- **`GET /api/tournament/stream?tournamentId=...`**
  - Auth: session required (same as prior lease stream).
  - Events: **`invalidate`** with body `{ type: 'invalidate', tournamentId }`.
  - Comment heartbeats (~20s) to keep proxies awake.
  - On connect the server emits **two** invalidate events (initial + post-subscribe) so races during connection setup are surfaced.

### Server pub/sub

- In-process bus: [`src/lib/tournament/tournament-sse-bus.ts`](d:\dev\tku-sparring\src\lib\tournament\tournament-sse-bus.ts)
- Publishers call `publishTournamentSelectionInvalidate(tournamentId)` (alias: `publishMatchInvalidateEvent`).
- Sources include **`ArenaMatchClaim`** after successful claim/release and **match/bracket mutations** where the roster must refresh.

### Client behavior

- [`use-tournament-sse-stream.ts`](d:\dev\tku-sparring\src\hooks\use-tournament-sse-stream.ts) subscribes and runs **`invalidateAdvanceSelectionQueries`** ([`advance-selection-invalidation.ts`](d:\dev\tku-sparring\src\queries\advance-selection-invalidation.ts)) so both `selectionCatalog` and `selectionMatches` TanStack Query keys for that tournament refetch (plus `['match']` for bracket data).
- **`useArenaMatchClaimSync`** (arena HUD) opens the same stream and runs **`arenaMatchClaim.heartbeat`** on the active match on an interval (no group lease acquire/release).

## Removed (historical)

- `GroupControlLease`, takeover queue, `orpc.lease.*`, `/api/lease/stream`, Advance “group lease” toggle, CRM builder lease popover/status.
