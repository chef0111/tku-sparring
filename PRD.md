# PRD: Admin Dashboard CRM for Athletes, Groups, and Brackets

- Status: Draft
- Owner: System Admin (MVP)
- Date: 2026-05-02

## Product Summary

The TKU Sparring System needs a dedicated admin CRM experience to manage athletes and tournaments at scale. The admin dashboard will provide a global athlete registry, a tournament builder with Groups and Brackets tabs, and a deterministic bracket canvas with manual overrides. The goal is to reduce setup time, improve accuracy in grouping and seeding, and provide a clean operational workflow from tournament creation to completion.

Target users:

- System Admins who run TKU tournaments and manage athlete rosters and brackets.

Primary value:

- One source of truth for athletes across tournaments.
- Fast, auditable, and deterministic tournament setup.
- Clear operational control of groups, brackets, and match progression.

## Goals

- Reduce tournament setup time to under 20 minutes for 256 athletes.
- Allow admins to manage athletes globally and reuse them across tournaments.
- Provide deterministic, auditable bracket generation with manual overrides.
- Ensure admin workflows are consistent, predictable, and error-tolerant.

## Non-goals (MVP)

- Multi-role permissions beyond System Admin.
- Double-elimination, round robin, or Swiss brackets.
- Public-facing bracket view or spectator UX.
- Real-time collaboration or multi-admin concurrency.
- Automated tournament completion without admin confirmation.

## MVP Scope

In scope:

- Global athlete registry with CRUD and de-dup validation.
- Tournament builder with two tabs: Groups and Brackets.
- Tournament athlete selection from global registry.
- Group constraints and auto-assign, with manual drag-and-drop overrides.
- Single-elimination brackets with optional third-place match per group.
- Custom SVG bracket canvas with DnD-kit interactions.
- Match records created in Draft; bracket locked in Active.
- Audit log for critical actions.

Out of scope:

- Public portals, athlete self-service, or scoring hardware integration.
- Multi-role permissions and approvals.
- Advanced analytics dashboards.

## Primary User Flow

1. Create tournament.
2. Open Tournament Builder and select Athletes from the global registry into the tournament pool.
3. Define groups with constraints (gender, belt range, weight range).
4. Run Auto-assign for group placement, then manually adjust via drag-and-drop.
5. Generate bracket in Draft and review seeds, locks, and BYEs.
6. Switch to Brackets tab, inspect the canvas, and edit match outcomes via the detail panel.
7. Set tournament to Active and record results as matches progress.
8. When all groups have winners, system shows "Ready to complete"; admin confirms to Complete.

## Key Features

### 1) Global Athlete Registry (Athletes Route)

What the user sees:

- A dedicated Athletes page with a data table listing all athletes.
- Create, Edit, Delete actions.
- Bulk action: Add to Tournament.
- Filters and sort options consistent with the existing data-table system.

Data / Inputs:

- `athleteCode` (admin-entered unique ID, optional)
- `name`
- `gender` (M/F)
- `beltLevel` (fixed array, values 0-10)
- `weight` (kg, 20-150 bounds)
- `affiliation`

UAC:

- User can create, edit, and delete athlete profiles.
- De-dup: if `athleteCode` + `name` already exist, block creation with a clear error.
- If `athleteCode` missing, show "possible duplicate" warning when a match on name + affiliation + weight + belt is detected, requiring manual confirmation.
- Filters and operators match the existing data-table capabilities from [src/config/data-table.ts](src/config/data-table.ts).

### 2) Add Athletes to Tournament (Bulk Action)

What the user sees:

- A modal triggered from the Athletes table bulk action.
- Tournament selector with typeahead and last-used default.
- Optional toggle: Auto-assign by constraints.

Data / Inputs:

- Selected athlete profiles (bulk selection)
- Tournament selection
- Optional auto-assign toggle

UAC:

- Selected athletes are added to the tournament as TournamentAthlete entries with status `selected`.
- If auto-assign is enabled, system runs assignment immediately using current group constraints.
- If auto-assign is disabled, athletes stay in the unassigned pool.

### 3) Groups Tab (Tournament Builder)

What the user sees:

- Split view: left panel shows selected athlete pool with filters, right panel shows groups.
- Group panels with counts and constraint badges.
- "Auto-assign" button to apply constraints.
- Warning badges for out-of-range athletes, with a "Fix assignments" action.
- Per-group settings drawer with third-place match toggle (default OFF).

Data / Inputs:

- Group name
- Constraints: gender (M/F), belt range, weight range
- Third-place match toggle
- Manual athlete placement via drag-and-drop

UAC:

- Admin can create, edit, and delete groups within a tournament.
- Auto-assign uses only the selected athlete pool and group constraints.
- Manual drag-and-drop overrides auto-assignment.
- If constraints are changed, existing assignments remain but show "out of range" warnings until fixed.

### 4) Brackets Tab (Tournament Builder)

What the user sees:

- One group bracket visible at a time.
- Group selector to switch between brackets.
- Custom SVG bracket canvas with drag-and-drop slots.
- Each node shows lock icon, seed number, athlete name, BO3 score, and status color.
- Right-side detail panel on match click to edit participants and record results.

Data / Inputs:

- Bracket generation trigger (Draft only)
- Manual drag-and-drop overrides
- Lock/unlock per athlete
- Shuffle action (Draft only)

UAC:

- Bracket generation creates Match records for the group in Draft.
- BYEs are auto-generated as empty slots to the next power of two; paired athletes auto-advance.
- Shuffle does not move locked athletes.
- Drag-and-drop is blocked for locked athletes unless unlocked.
- Brackets cannot be regenerated in Active or Completed.

### 5) Match Results and Status

What the user sees:

- BO3 score displayed on the bracket node.
- Match status indicators: pending, active, complete (color-coded).
- Detail panel with editable scores and participants (Draft/Active only).

Data / Inputs:

- Per-match BO3 round wins (redWins, blueWins)
- Manual winner override (Draft/Active only)

UAC:

- Winner is auto-derived from BO3 wins.
- Manual winner override is logged in the audit log.
- Scores are read-only in Completed tournaments.

### 6) Tournament Lifecycle and Completion

What the user sees:

- Tournament status label (Draft, Active, Completed).
- Banner when all groups have winners: "Ready to complete".

Data / Inputs:

- Manual status transition controls (Draft -> Active -> Completed)

UAC:

- Only System Admin can transition status.
- Bracket structure is locked in Active; scores remain editable.
- Completed tournaments are fully read-only.

### 7) Audit Log (Per Tournament)

What the user sees:

- Activity panel listing critical actions with timestamp and admin name.

Data / Inputs:

- Event types: manual winner override, score edit, reseed/shuffle, group assignment changes

UAC:

- Each listed event captures who did it, when, and the affected entity (group/match/athlete).
- Activity list is filterable by event type (optional for MVP).

## Functional Requirements

- Global athletes are managed in a dedicated route; tournament builder uses selected pool only.
- De-dup rules are enforced before creating athlete profiles.
- Seeding algorithm: sort by belt (higher first), then weight ascending; seed placements follow standard bracket seeding; ties randomized within tier.
- Bracket format is single-elimination only; optional third-place match per group.
- Bracket generation is Draft-only and creates Match records; regeneration deletes and recreates Draft matches.
- Active tournaments allow score edits but no shuffle; bracket changes require explicit unlock.
- Completed tournaments are read-only.
- Performance targets: 256 athletes per tournament, 8 groups per tournament, 32 athletes per group.

## Target Technical Shape

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

### UI Surfaces

- Athletes route: extend [src/features/dashboard/athlete/index.tsx](src/features/dashboard/athlete/index.tsx) to include global data-table and actions.
- Tournament Builder tabs: extend [src/features/dashboard/tournament/builder/index.tsx](src/features/dashboard/tournament/builder/index.tsx) to render Groups and Brackets content.
- Data-table features should reuse components such as [src/components/data-table/data-table.tsx](src/components/data-table/data-table.tsx).

### State and Logic

- Query patterns should align with existing query hooks in [src/queries/tournaments.ts](src/queries/tournaments.ts) and [src/queries/groups.ts](src/queries/groups.ts).
- Bracket rendering should be deterministic and derived from Match records.
- Locks are per athlete and applied during shuffle and drag operations.

### Non-functional Constraints

- Maintain UI responsiveness for 256-athlete datasets.
- Enforce weight bounds and belt-level validation on both client and server.
- Ensure all critical actions are logged in TournamentActivity.

## Risks and Mitigations

- Risk: inconsistent athlete profiles across tournaments. Mitigation: global AthleteProfile + TournamentAthlete snapshot with explicit "sync".
- Risk: bracket regeneration in Draft causing data loss. Mitigation: clear confirmation dialog and audit log entry.
- Risk: manual overrides in Active can cause disputes. Mitigation: audit log with admin identity and timestamps.

## Open Questions

- None for MVP. All key decisions are captured above.
