# Tournament realtime (Socket.io)

Replaces the former in-process SSE bus. The **web app** (Vercel) does not hold WebSocket connections; a small **Node realtime service** in [`realtime/`](../realtime/) runs Socket.io. After mutations, server code calls `publishTournamentSelectionInvalidate` in [`src/lib/tournament/tournament-sse-bus.ts`](../src/lib/tournament/tournament-sse-bus.ts), which `POST`s to the realtime service’s `/internal/broadcast` endpoint so all browsers in room `tournament:{id}` receive an `invalidate` event and refetch via TanStack Query ([`advance-selection-invalidation.ts`](../src/queries/advance-selection-invalidation.ts)).

## Environment (main app)

| Variable                             | Where          | Purpose                                                                                                 |
| ------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------- |
| `REALTIME_INTERNAL_BROADCAST_URL`    | Server only    | Full URL to `POST` (e.g. `https://realtime.example.com/internal/broadcast`)                             |
| `REALTIME_INTERNAL_BROADCAST_SECRET` | Server only    | Bearer token for that POST                                                                              |
| `TOURNAMENT_SOCKET_JWT_SECRET`       | Server only    | HS256 secret for issuing [`/api/tournament/socket-token`](../src/routes/api/tournament/socket-token.ts) |
| `VITE_REALTIME_URL`                  | Client (build) | Socket.io origin (e.g. `https://realtime.example.com`)                                                  |

## Environment (realtime service)

See [`realtime/README.md`](../realtime/README.md).

## Arena client visibility

Advance Settings lists only tournaments with **`status === 'active'`** (admin activates via existing lifecycle). `selectionMatches` rejects non-active tournaments.

## Historical note

Older docs referred to `GET /api/tournament/stream` (SSE). That route was removed in favor of WebSockets + HTTP broadcast.
