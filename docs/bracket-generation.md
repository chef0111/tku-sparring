# Bracket Generation

This document captures bracket generation behavior and match labeling for the tournament builder.

## Bracket Materialization

- Bracket generation creates the full single-elimination tree up front for a group.
- All rounds are materialized in Draft so the bracket canvas is deterministic.

## Match Linkage

- Progression is defined by the single-elimination tree over `(round, matchIndex)`.
- For a match at round `r > 0` and index `i`, the **red** feeder is the match at `(r - 1, 2i)` and the **blue** feeder is `(r - 1, 2i + 1)` in the same group.
- Round 0 holds initial placements (seeds, BYEs, open slots).

## Round-0 placement (shuffle)

- The bracket shell size is the next power of two ≥ group athlete count.
- **Shuffle** assigns athletes to **seed positions** `1 … N` using a uniform random permutation of the (unlocked) pool, then maps seeds to physical slots via the standard tournament **slot order** from `buildSlotMap` (e.g. size 8: `[1, 8, 4, 5, 2, 7, 3, 6]`). Seeds `N+1 … bracketSize` are BYEs.
- After shuffle, **athlete vs BYE** opening matches are marked **complete** with **0–0** on the board; the athlete is still recorded as the winner and advances to the next round.
- Each opening-round match therefore has at least one athlete or one BYE slot that will pair with a real athlete; there are no “phantom” round-0 matches with both sides empty.

## Third-Place Match

- When enabled **and the group has at least four athletes**, a dedicated Third-Place Match is created and wired to the semifinal losers.
- The Third-Place Match is part of the bracket canvas and audit trail.
- In the group settings UI, the third-place option is disabled until the group has four or more athletes.

## Match display numbers (arena sequence)

- Display numbers are `arenaIndex * 100` + a **1-based sequence** shared across all groups on that arena (e.g. Arena 1 → 101, 102, …; Arena 2 → 201, 202, …).
- **Round 0 advanced rows** (exactly one athlete vs **Open** / empty) are **not** assigned a display number: the map stores `null` for that match id so the sequence does not advance for that row. The bracket header shows **Advanced** instead of `Match {n}`.
- **Round 0** rows with **both** slots open and **no** display number use a **blank** header (not “Advanced”); upper-round empty slots use **Winner {n}** when the feeder has a number, otherwise the advancer’s name when the feeder is complete, otherwise **Open** (see `formatMatchHeaderLine` / `formatFeederWinnerPlaceholder` in [`src/lib/tournament/arena-match-label.ts`](../src/lib/tournament/arena-match-label.ts)).
- **Round 0 BYE vs BYE** (both standard seed positions are beyond the roster size for the bracket shell) never receive athletes; they also get `null` and **do not** advance the arena sequence, same as advanced rows.
- The same **null** numbering applies when **every roster athlete already appears on round 0** in that group but a round-0 row is still fully empty (no further assignable slots without a swap).
- **Upper rounds:** a match whose two round-0 feeders are not both phantoms, and where **exactly one** round-0 feeder is a **phantom** (both tournament-athlete slots still empty on that opening match), is also **not** numbered — e.g. a semifinal between a real opening match and an empty shell row (does not consume the arena sequence), including after the real side has already received an advancer.
- **Third-Place Match** is numbered **immediately before the Final** within the same ordering rules below.
- Example for an 8-athlete bracket in Arena 1 (single group, third-place on): Match 107 (Third-Place), Match 108 (Final).

### Multiple groups on the same arena

When several groups share one `arenaIndex`, they share **one** sequence for that arena. Ordering is:

1. **Round** ascending (all of round 0, then all of round 1, …).
2. Within each round, **group order**: an ordered list of `groupId`s for that arena (default: order of groups in the tournament list until a saved arena order exists).
3. Within each `(round, group)` bucket: matches follow bracket order (`matchIndex`, with third-place before final on the final round when that toggle is on), **counting only matches that receive a display number** for the global arena sequence. Optional per-match `arenaSequenceRank` can override order inside that bucket among numbered matches; advanced rows keep `null` and do not consume the next integer.

Example: Groups **A** and **B** on Arena 1, same structure, group order `[A, B]`. Match `round` is zero-based (the canvas labels `round === 0` as **Round 1**, then **Semifinal**, **Final**, etc.):

- `round === 0` (first bracket round) for A: 101–104
- `round === 0` for B: 105–108
- `round === 1` (semifinals) for A: 109–110
- `round === 1` for B: 111–112
- …and so on for later rounds.

## Builder UI labels

- **Round 0**, empty athlete slot: show **Open** (not a “winner” placeholder).
- **Round ≥ 1**, empty athlete slot: when the feeder has an arena display number, show **`Winner {n}`** where **`n`** is that feeder’s number from the shared arena map. When the feeder has **no** display number, show the **advancing athlete’s name** if the feeder is already complete, otherwise **Open**.
- Full match titles use **`Match {n}`** when **`n`** is present. When **`n`** is null: **Advanced** for a real advanced (one athlete) row; **blank** when both slots are still open on that match.
