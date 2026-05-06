# Todo Technical Changes

This document captures the technical direction and phased delivery plan for the TKU Sparring System.

## Technical Shape

### Data Model Changes (Prisma)

- Replace current Athlete model with:
  - `AthleteProfile` (global identity)
    - `athleteCode` (optional)
    - `name`
    - `gender`
    - `beltLevel`
    - `weight`
    - `affiliation`
  - `TournamentAthlete` (tournament participation)
    - `tournamentId`
    - `athleteProfileId`
    - `groupId` (nullable)
    - `seed`
    - `locked`
    - `status` (selected/assigned/eliminated)
    - `notes` (optional)
    - Snapshot fields: `gender`, `beltLevel`, `weight`, `affiliation`
- Extend Group with constraints and third-place toggle.
- Extend Match with bracket metadata: round, matchIndex, status, bestOf (3), and references to TournamentAthlete IDs.
- Add TournamentActivity for audit log events.

Reference: current schema in [prisma/schema.prisma](prisma/schema.prisma).

### API / RPC Changes

- Update orpc routes to align with new models in [src/orpc/router.ts](src/orpc/router.ts):
  - AthleteProfile CRUD
  - TournamentAthlete CRUD and bulk-add action
  - Group constraints and auto-assign endpoints
  - Bracket generation endpoint (Draft only)
  - Match score update with audit logging
- Add a slim "selection view" endpoint for Advance Settings (tournament/group/match lookup).
  - Tournament fields: `id`, `name`, `status`
  - Group fields: `id`, `name`, `tournamentId`, `status`, `leaseStatus`, `arenaId` or `arenaLabel`
  - Match fields: `id`, `name`, `groupId`, `status`, `redAthleteName`, `blueAthleteName`
  - Status values: Tournament `draft|active|completed`, Group `draft|active|completed`, Match `pending|active|complete`
  - Lease status values: `available`, `held_by_me`, `held_by_other`, `pending_takeover`
  - Match naming: `Match {arenaIndex}{sequence}`, sequence starts at 01 per arena (e.g., Match 101, 102)
  - Match sequence source: bracket order at generation time (manual scheduling deferred)

### UI Surfaces

- Athletes route: extend [src/features/dashboard/athlete/index.tsx](src/features/dashboard/athlete/index.tsx) to include global data-table and actions.
- Tournament Builder tabs: extend [src/features/dashboard/tournament/builder/index.tsx](src/features/dashboard/tournament/builder/index.tsx) to render Groups and Brackets content.
- Data-table features should reuse components such as [src/components/data-table/data-table.tsx](src/components/data-table/data-table.tsx).

### State and Logic

- Query patterns should align with existing query hooks in [src/queries/tournaments.ts](src/queries/tournaments.ts) and [src/queries/groups.ts](src/queries/groups.ts).
- Bracket rendering should be deterministic and derived from Match records.
- Locks are per athlete and applied during shuffle and drag operations.
- Lease presence is delivered by SSE from the server, and refreshed locally via heartbeat mutations.

### Non-functional Constraints

- Maintain UI responsiveness for 256-athlete datasets.
- Enforce weight bounds and belt-level validation on both client and server.
- Ensure all critical actions are logged in TournamentActivity.
