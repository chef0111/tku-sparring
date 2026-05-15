# Historical: tournament selection sync (SSE)

This document described **Server-Sent Events** for tournament-scoped invalidation. **SSE has been removed** in favor of a **Socket.io** realtime service plus HTTP internal broadcast.

**Current documentation:** [`docs/tournament-realtime.md`](./tournament-realtime.md)

---

## Archived goals (unchanged intent)

- Push match-claim related invalidations so multiple arenas/devices refetch.
- One subscription per authenticated user session per tournament (now: one socket with JWT).
- Keep client logic thin: events signal “refetch Advance selection”; data still comes from oRPC.

### Removed server route

- ~~`GET /api/tournament/stream`~~ — replaced by `GET /api/tournament/socket-token` + Socket.io client.

### Removed (historical)

- `GroupControlLease`, takeover queue, `orpc.lease.*`, `/api/lease/stream`, Advance “group lease” toggle, CRM builder lease popover/status.
