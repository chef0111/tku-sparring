# SSE Plan: Group Control Lease

This document describes the Server-Sent Events (SSE) approach for Group Control Lease updates.

## Goals

- Push group lease status changes without WebSockets.
- Keep client logic simple and responsive for multiple arenas.
- Avoid per-group streams; use a single stream per tournament.

## Stream Scope

- One SSE stream per tournament.
- The stream includes lease updates for all groups in the tournament.

## Suggested Endpoints

The implemented tournament stream endpoint is `GET /api/lease/stream?tournamentId=...`.
The lease mutations themselves are exposed through the authenticated oRPC router rather
than separate REST-style `/api/leases/*` routes.

- `GET /api/lease/stream?tournamentId=...`
  - SSE channel for lease updates.
- `orpc.lease.acquire({ groupId, deviceId })`
  - Acquire a lease for a group.
- `orpc.lease.heartbeat({ groupId, deviceId })`
  - Extend the lease TTL.
- `orpc.lease.release({ groupId, deviceId })`
  - Release a lease explicitly.
- `orpc.lease.requestTakeover({ groupId, deviceId })`
  - Request a takeover from the current holder.
- `orpc.lease.respondTakeover({ requestId, approve, deviceId })`
  - Approve or deny a takeover request from the active holder device.
- `GET /api/selection-view?tournamentId=...`
  - Slim lookup for Advance Settings (tournaments, groups, matches).

## Event Types

- Current implementation sends:
  - `snapshot`
  - `invalidate`
- Rich event-specific payloads such as `lease.acquired` or `lease.expired` can still be
  added later if the Groups tab needs more granular live updates.

## Event Payload (Example)

```json
{
  "groupId": "grp_123",
  "tournamentId": "t_456",
  "adminId": "admin_1",
  "deviceId": "device_a",
  "expiresAt": "2026-05-02T10:15:30.000Z",
  "status": "online"
}
```

## Client Behavior

- On group selection, call `acquire` and start heartbeat (every 20s).
- Subscribe to the tournament SSE stream and update status badges immediately.
- If lease belongs to another device, show Degraded status and a Takeover action.
- A takeover request creates a pending entry in the Takeover Queue until approved, denied, or expired.
- If lease expires, show the group as available.
- Identify devices with a persistent UUID stored in localStorage.
- On page unload, attempt to release the lease explicitly, but rely on TTL for correctness.
- Show takeover requests as action toasts with Approve/Deny, and a separate action to open the full queue.

## Server Behavior

- Leases use a 60s TTL and expire if no heartbeat is received before `expiresAt`.
- Allow up to 2 missed heartbeats before expiry (effective ~40s grace).
- The server broadcasts lease changes to the SSE stream.
- Takeover approval logs the previous holder and emits `lease.takeover_approved`.
- If no response is received, takeover requests are resolved by lease expiry (no forced takeover).
- Audit log events: lease acquire, release, takeover request, approve/deny. Skip heartbeat renewals.

## Takeover Queue

- A Takeover Queue can contain multiple pending requests.
- The current holder can select any requester to approve, deny individual requests, or deny all.
- When a takeover is approved, the lease transfers immediately and the queue clears.
- If the lease expires, the queue clears and a new holder must call acquire; stale requests are discarded.
- Requests expire after a short fixed window (20s-30s) and emit `lease.takeover_request_expired`.
- Queue entries include `requestId`, `adminId`, `deviceId`, `requestedAt`, and optional `reason`.
- SSE includes the full queue only on events that change it.

## UI Mapping

- Holder device: `Status` with `status="online"`.
- Other devices: `Status` with `status="degraded"`.
- In Advance Settings, groups leased by others are visible but disabled, with Degraded status and a Takeover action.
