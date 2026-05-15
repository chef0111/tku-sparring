# PRD: TKU Sparring System

- Status: Draft
- Owner: System Admin (MVP)
- Date: 2026-05-02

## Product Summary

The TKU Sparring System is a full tournament operations platform that serves both arena-side clients and system admins. It includes an arena client for match execution and scoring, and an admin CRM for managing athletes, tournaments, groups, and brackets. The CRM provides a global athlete registry, a tournament builder with Groups and Brackets tabs, and a deterministic bracket canvas with manual overrides. The goal is to reduce setup time, improve accuracy in grouping and seeding, and provide a clean operational workflow from tournament creation through match completion.

Target users:

- System Admins who run TKU tournaments and manage athlete rosters, groups, and brackets.
- Arena Operators who run matches and record results on the arena client.

Primary value:

- One source of truth for athletes across tournaments.
- Fast, auditable, and deterministic tournament setup.
- Simple arena-side scoring that stays in sync with official records.
- Clear operational control of groups, brackets, and match progression.

## Goals

- Reduce tournament setup time to under 20 minutes for 256 athletes.
- Allow admins to manage athletes globally and reuse them across tournaments.
- Provide deterministic, auditable bracket generation with manual overrides.
- Ensure admin workflows are consistent, predictable, and error-tolerant.
- Keep arena-side match flow fast and resilient, even with intermittent connectivity.

## Non-goals (MVP)

- Multi-role permissions beyond System Admin.
- Double-elimination, round robin, or Swiss brackets.
- Public-facing bracket view or spectator UX.
- Real-time collaborative editing of brackets or groups beyond per-match reservation (see **Arena match claim** in [CONTEXT.md](CONTEXT.md)).
- Automated tournament completion without admin confirmation.
- Advanced hardware integration beyond existing scoring inputs.

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
- **Arena match claim** (per selectable match, TTL + heartbeat) so only one device can apply a match at a time; live updates via SSE.
- Arena client for match execution and scoring.
- Arena-side selection flow (Advance Settings) with per-device restore.
- Round-end score submission and match-end finalization.
- Offline-tolerant scoring with delayed sync on reconnect.

Out of scope:

- Public portals, athlete self-service, or scoring hardware integration.
- Multi-role permissions and approvals.
- Advanced analytics dashboards.
- Automated next-match scheduling or auto-advance in the arena client.

## Primary User Flow

1. Create tournament.
2. Open Tournament Builder and select Athletes from the global registry into the tournament pool.
3. Define groups with constraints (gender, belt range, weight range).
4. Run Auto-assign for group placement, then manually adjust via drag-and-drop.
5. Generate bracket in Draft and review seeds, locks, and BYEs.
6. Switch to Brackets tab, inspect the canvas, and edit match outcomes via the detail panel.
7. Set tournament to Active and record results as matches progress.
8. When all groups have winners, system shows "Ready to complete"; admin confirms to Complete.

Arena flow (per device):

1. Open Advance Settings and select tournament, group, and match.
2. Run the match on the arena client and score each round.
3. Submit round-end results; finish the match to finalize and return to selection.

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
- Group status badge in Advance Settings reflects selection / lifecycle (e.g. Selected, Open, Finished), not group-wide leases.

Data / Inputs:

- Group name
- Constraints: gender (M/F), belt range, weight range
- Third-place match toggle
- Manual athlete placement via drag-and-drop
- Device identity (`deviceId`) for arena/API calls and per-match claims
- Arena assignment (manual dropdown)

UAC:

- Admin can create, edit, and delete groups within a tournament.
- Auto-assign uses only the selected athlete pool and group constraints.
- Manual drag-and-drop overrides auto-assignment.
- If constraints are changed, existing assignments remain but show "out of range" warnings until fixed.
- Advance Settings lists groups and selectable matches independently; matches **in use by another device** show Degraded/In use and cannot be chosen until released or TTL expiry.
- Advance Settings auto-restores the last selected tournament, group, and match per device after login.
- Admin can assign each group to an arena using a dropdown in Groups tab.
- Arena list is configured per tournament in the builder (default 3: Arena 1-3).
- Arena labels are editable, defaulting to "Arena 1-N".
- Arena ordering becomes fixed once matches are generated to keep match labels stable.
- Arena assignment is locked once matches are generated to keep match labels stable.

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
- Match-claim renewals are not logged as activity rows.
- Activity list is filterable by event type (optional for MVP).

### 8) Arena Client (Match Execution)

What the user sees:

- Full-screen scoring UI for a single match.
- "Advance Settings" to select tournament, group, and match.
- "Match Result" modal with a "Finish Match" action.

Data / Inputs:

- Selected tournament, group, and match.
- Per-round scoring inputs.

UAC:

- Arena devices restore the last selected tournament, group, and match per device.
- Round-end results are submitted automatically.
- "Finish Match" finalizes the match, then the operator opens the menu, chooses "Advance Settings", selects a match via combobox, and confirms.
- Match execution keeps the active **Arena match claim** refreshed while a bout is mounted; expiry or conflicts surface when selecting/applying another match.
- If the device goes offline, scoring continues locally and syncs on reconnect.

## Functional Requirements

- Global athletes are managed in a dedicated route; tournament builder uses selected pool only.
- De-dup rules are enforced before creating athlete profiles.
- Seeding algorithm: sort by belt (higher first), then weight ascending; seed placements follow standard bracket seeding; ties randomized within tier.
- Bracket format is single-elimination only; optional third-place match per group.
- Bracket generation is Draft-only and creates Match records; regeneration deletes and recreates Draft matches.
- Active tournaments allow score edits but no shuffle; bracket changes require explicit unlock.
- Completed tournaments are read-only.
- Applying Advance Settings succeeds only after `**arenaMatchClaim.claim`\*\* for the chosen match; another device holding a non-expired claim blocks Apply for that row.
- **Arena match claims** use a ~60s TTL; the arena sends **heartbeats** on the configured interval while a Mongo ObjectId-shaped match id is active.
- **SSE** broadcasts `**invalidate`\*\* for a tournament so all clients refresh Advance selection queries (`selectionCatalog`, `selectionMatches`) and bracket `match` queries.
- Coordinating identity uses a persistent **device UUID** in `localStorage`.
- **Finish Match** releases the claim and clears the advance form match field; explicit release on unload is best-effort; TTL remains the safety net.
- Performance targets: 256 athletes per tournament, 8 groups per tournament, 32 athletes per group.
- Arena client is a separate experience from the admin CRM.
- Arena selection uses Advance Settings as the primary flow for MVP.
- Round-end results are submitted automatically; match completion is finalized by "Finish Match".
- After finishing a match, the arena client returns to Advance Settings without auto-advancing.

## Target Technical Shape

### Tech Stack

- Frontend: Tanstack Start + React + TypeScript
- Backend: oRPC + Tanstack Query
- Data model: `tournament`, `group`, `match`, `athleteProfile`, `tournamentAthlete`
- Storage: S3 bucket (planned for athlete images, but deferred for MVP)
- Auth Model: System Admin only for MVP; arena-client access scoped to match execution.

### Project Phases

- Phase 1: Admin CRM Foundation
  - Athlete registry + de-dup
  - Tournament builder (Groups/Brackets)
  - Bracket generation + audit log
- Phase 2: Arena Client Integration
  - Advance Settings API integration
  - Match claims + tournament SSE for selection sync
  - Round-end submission + Finish Match flow
- Phase 3: Hardening + Scale
  - Offline tolerance improvements
  - Performance tuning for 256 athletes
  - Operational monitoring

## Risks and Mitigations

- Risk: inconsistent athlete profiles across tournaments. Mitigation: global AthleteProfile + TournamentAthlete snapshot with explicit "sync".
- Risk: bracket regeneration in Draft causing data loss. Mitigation: clear confirmation dialog and audit log entry.
- Risk: manual overrides in Active can cause disputes. Mitigation: audit log with admin identity and timestamps.

## Open Questions

- None for MVP. All key decisions are captured above.
