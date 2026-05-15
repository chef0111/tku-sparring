# Design: Skip arena display numbers for athlete vs BYE (round 0)

> Status: **Implemented** (approach 2 — `Map<string, number | null>` with full key coverage)  
> Date: 2026-05-15  
> Decision: **B** — BYE auto-matches **do not** receive a `Match {n}` arena display number; the public sequence **only** assigns numbers to matches that “count” for scheduling.

## Problem

Today [`buildSharedArenaMatchNumberById`](../../src/lib/tournament/arena-match-label.ts) assigns consecutive display numbers to **every** match in round-major, group, bracket order. For a 5-athlete bracket, three **athlete vs Open** R0 rows consume three numbers before the only **two-athlete** R0 bout. Operators want that real bout to be the first numbered opening match (e.g. **Match 205**), and BYE paths to not consume the shared arena counter.

## Product definition

### Excluded from arena sequence (no display number)

A match is **excluded** when all are true:

- `round === 0`
- Exactly one side has a `tournamentAthleteId` and the other does **not** (structural bye / advanced row: athlete vs Open).

**Included** (receives the next `arenaIndex * 100 + k` number as today):

- Any R0 match with **both** athletes assigned.
- Any R0 match with **neither** side assigned (empty shell — rare after shuffle; still materialized).
- All matches with `round > 0` (semifinals, final, third-place).

**Note:** Excluded matches remain real `Match` rows (progression, claims, audit). Only the **arena display number map** omits them.

### UI copy when no number

| Surface                                            | Behavior                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bracket node header (`Match {n}`)                  | If `matchLabel.get(id)` is missing: show **no** numeric title, e.g. **“Advanced”** or **“Bye”** (pick one canonical label; avoid “Match undefined”).                                                                                                                                                                                                   |
| Detail sheet title                                 | Same rule as header.                                                                                                                                                                                                                                                                                                                                   |
| `Winner {n}` placeholder (round ≥ 1, feeder in R0) | If feeder has **no** display number: do **not** render `Winner undefined`. Use **`Advanced`** (same canonical word) **or** the advancing athlete’s name if the feeder match is already `complete` and winner is known. Prefer **name** when resolvable in one hop from `MatchData`, else **Advanced**.                                                 |
| Advance Settings catalog                           | Already uses `n != null ? formatArenaMatchTitle(n) : fallback`; keep a stable fallback (short id slice or “Advanced”) for excluded rows if any such match could appear — **note:** selection catalog filters to `pending`/`active` with **both** athletes, so completed BYE R0 rows typically **never** appear in the combobox. Confirm no regression. |

## Approaches considered

1. **Omit from numbering only (recommended)**  
   Extend `buildSharedArenaMatchNumberById` (and single-group `buildArenaMatchNumberById`) to iterate the same global order as today, but **increment `k` only** for matches that are not excluded. The returned `Map` simply has **no entry** for excluded match ids.  
   **Pros:** Minimal surface; matches unchanged in DB; docs + tests align with one function.  
   **Cons:** All `matchLabel.get(id)` call sites must treat **missing** as “no public number” (small UI sweep).

2. **Explicit `null` sentinel in map**  
   `Map<string, number | null>` with `null` = excluded.  
   **Pros:** Explicit “known excluded” vs “unknown id”.  
   **Cons:** Wider type churn across builder + arena.

3. **Reorder R0 only (contested first) but still number BYEs**  
   User rejected this (that was option **A**); BYEs would still get numbers.

**Choice:** Approach **1**.

## Technical outline

- Add `isExcludedFromArenaDisplaySequence(match: MatchData): boolean` in [`arena-match-label.ts`](../../src/lib/tournament/arena-match-label.ts) (or a tiny adjacent module) — pure, unit-tested.
- In `buildSharedArenaMatchNumberById`, after building `ordered` array as today, filter to `numbered = ordered.filter((m) => !isExcluded(...))` **or** skip `map.set` + skip increment for excluded rows (same effect: only numbered matches get `base + k + 1`).
- Update [`docs/bracket-generation.md`](../../docs/bracket-generation.md) §Match display numbers: state that R0 athlete-vs-bye rows are **not** part of the arena sequence; document the predicate and placeholder rules for `Winner` labels.
- Update [`arena-match-label.test.ts`](../../src/lib/tournament/__test__/arena-match-label.test.ts): fixture with mixed R0 bye + contest; assert contest gets first number, bye ids absent from map; later rounds unchanged.
- UI: [`bracket-match-node.tsx`](../../src/features/dashboard/tournament/builder/components/brackets-tab/bracket-canvas/bracket-match-node.tsx), [`match-detail-panel/index.tsx`](../../src/features/dashboard/tournament/builder/components/brackets-tab/match-detail-panel/index.tsx), [`bracket-action-queue.tsx`](../../src/features/dashboard/tournament/builder/components/brackets-tab/groups-panel/bracket-action-queue.tsx) — any `Match {matchLabel.get(...)}` needs safe formatting.
- Types: `matchLabel` in context can become `Map<string, number>` with **absent** keys (unchanged type) **or** `Map<string, number | undefined>` if we want explicit `.get` typing; prefer **absent keys** + small formatter helper `formatMatchHeader(matchId, labelMap)`.

## Risks / edge cases

- **Manual `arenaSequenceRank`:** If an operator ranks a BYE row, it still has no public number; rank only affects relative order among **numbered** matches in the same bucket — document that excluded matches ignore manual rank for display (or strip rank for excluded in UI only).
- **Both-empty R0:** Still numbered (included) so empty shells remain addressable if ever shown.
- **Consistency:** Feeder resolution must never show `Winner NaN`.

## Testing

- Unit: `isExcluded` true/false matrix (both athletes, one athlete, neither, wrong round).
- Unit: `buildSharedArenaMatchNumberById` / `buildArenaMatchNumberById` with 4 R0 matches where 3 are bye-rows → map size and first contest number assertions.
- Optional: snapshot or component test for bracket header when label missing (if harness exists).

## Out of scope

- Changing Prisma schema or match progression.
- Renaming internal match ids or bracket `(round, matchIndex)` rules.

## Self-review

- No TBD sections; predicate is explicit.
- Aligns with user **B** (no number, sequence skips).
- Single implementation slice: numbering + UI + docs + tests.

---

**Next step after you approve this spec:** implementation plan (task list) and code changes.
