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

- `GET /api/leases/stream?tournamentId=...`
  - SSE channel for lease updates.
- `POST /api/leases/acquire`
  - Acquire a lease for a group.
- `POST /api/leases/heartbeat`
  - Extend the lease TTL.
- `POST /api/leases/release`
  - Release a lease explicitly (optional).
- `POST /api/leases/request-takeover`
  - Request a takeover from the current holder.
- `POST /api/leases/respond-takeover`
  - Approve or deny a takeover request.
- `GET /api/selection-view?tournamentId=...`
  - Slim lookup for Advance Settings (tournaments, groups, matches).

## Event Types

- `lease.acquired`
- `lease.renewed`
- `lease.released`
- `lease.expired`
- `lease.takeover_requested`
- `lease.takeover_approved`
- `lease.takeover_denied`

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
- A takeover request creates a pending state for the requester until approved, denied, or expired.
- If lease expires, show the group as available.
- Identify devices with a persistent UUID stored in localStorage.
- On page unload, attempt to release the lease explicitly, but rely on TTL for correctness.
- Show takeover requests as action toasts with Approve/Deny.

## Server Behavior

- Leases use a 60s TTL and expire if no heartbeat is received before `expiresAt`.
- Allow up to 2 missed heartbeats before expiry (effective ~40s grace).
- The server broadcasts lease changes to the SSE stream.
- Takeover approval logs the previous holder and emits `lease.takeover_approved`.
- If no response is received, takeover requests are resolved by lease expiry (no forced takeover).
- Audit log events: lease acquire, release, takeover request, approve/deny. Skip heartbeat renewals.

## UI Mapping

- Holder device: `Status` with `status="online"`.
- Other devices: `Status` with `status="degraded"`.
- In Advance Settings, groups leased by others are visible but disabled, with Degraded status and a Takeover action.
