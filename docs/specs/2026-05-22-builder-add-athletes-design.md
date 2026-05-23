# Builder Add Athletes — Design Spec

**Date:** 2026-05-22  
**Status:** Approved for implementation

## Problem

Setup checklist "Add athletes" deep-links to the builder Groups tab, but the unassigned pool only shows athletes **already in the tournament**. The only add path today is the global Athletes page + `BulkAddAthletesDialog` (requires picking a tournament).

## Goals

1. Let organizers pick athletes from the org **AthleteProfile** library directly in the builder.
2. Add selected profiles as **TournamentAthlete** rows (unassigned pool by default).
3. Optional auto-assign into matching **Groups** by constraints (checkbox, off by default).
4. Fix the dormant `autoAssign` flag on `tournamentAthlete.bulkAdd` and consolidate tournament-wide auto-assign orchestration.

## Decisions

| Decision         | Choice                                          |
| ---------------- | ----------------------------------------------- |
| Primary source   | Org athlete library (profiles)                  |
| Post-add default | Unassigned pool                                 |
| Auto-assign      | Checkbox, **unchecked by default**              |
| UI shell         | Right-side Sheet (matches `GroupSettingsSheet`) |

## Entry points

1. **Pool header** — persistent "Add athletes" button (hidden when read-only)
2. **Empty pool state** — primary CTA "Add from library"
3. **Setup checklist deep link** — `?tab=groups&addAthletes=1` auto-opens sheet

## Sheet UX

```
Add athletes to {tournamentName}
[Search name or ID]
[Gender] [Belt] [Weight]
☐ Select all on page (N)
┌ scrollable list with infinite scroll ┐
│ ☐ Jane Doe · F · Blue · 58kg · TKU │
└─────────────────────────────────────┘
☐ Auto-assign by group constraints
N selected          [Cancel] [Add to tournament]
```

- List shows org profiles **not already in this tournament** (server-filtered via `excludeTournamentId`).
- Multi-select with "select all on page"; selection persists while scrolling.
- Reuses pool filter components for gender/belt/weight.

## Architecture

### Auto-assign audit

| Module                                          | Status                                      |
| ----------------------------------------------- | ------------------------------------------- |
| `tournamentAthlete.bulkAdd` + `autoAssign` flag | Was a stub; implement in this feature       |
| `group.autoAssign`                              | Per-group; works                            |
| `group.autoAssignAll`                           | New; wraps `GroupDAL.autoAssignAllEligible` |
| `AutoAssignAllDialog`                           | Refactored to use `group.autoAssignAll`     |

### Data flow

1. User selects profiles → clicks Add to tournament.
2. `bulkAddAthletes({ tournamentId, athleteProfileIds, autoAssign })`.
3. If `autoAssign`: call `GroupDAL.autoAssignAllEligible` after bulk create.
4. Return accurate `{ added, assigned, unassigned }` for newly added batch.
5. Toast via `bulkAddAthleteResult()`; invalidate queries; pool refreshes.

## Edge cases

| Case                                       | Behavior                                                              |
| ------------------------------------------ | --------------------------------------------------------------------- |
| All library athletes already in tournament | Empty list: "Everyone in your library is already in this tournament." |
| Zero profiles in org                       | Link to `/dashboard/athletes`                                         |
| Partial duplicates in selection            | Server skips; toast reflects actual counts                            |
| autoAssign + no groups                     | Add to pool; auto-assign assigns 0                                    |
| Read-only tournament                       | No trigger buttons                                                    |

## Out of scope (v1)

- Create-new-athlete inline
- CSV import from builder
- Full DataTable advanced filters from athletes page
