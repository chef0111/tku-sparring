# Bracket Generation

This document captures bracket generation behavior and match labeling for the tournament builder.

## Bracket Materialization

- Bracket generation creates the full single-elimination tree up front for a group.
- All rounds are materialized in Draft so the bracket canvas is deterministic.

## Match Linkage

- Progression is defined by the single-elimination tree over `(round, matchIndex)`.
- For a match at round `r > 0` and index `i`, the **red** feeder is the match at `(r - 1, 2i)` and the **blue** feeder is `(r - 1, 2i + 1)` in the same group.
- Round 0 holds initial placements (seeds, BYEs, open slots).

## Third-Place Match

- When enabled, a dedicated Third-Place Match is created and wired to the semifinal losers.
- The Third-Place Match is part of the bracket canvas and audit trail.

## Match display numbers (arena sequence)

- Display numbers are `**arenaIndex * 100` + a 1-based sequence\*\* (e.g. Arena 1 → 101, 102, …; Arena 2 → 201, 202, …).
- **Third-Place Match** is numbered **immediately before the Final** within the same ordering rules below.
- Example for an 8-athlete bracket in Arena 1 (single group, third-place on): Match 107 (Third-Place), Match 108 (Final).

### Multiple groups on the same arena

When several groups share one `arenaIndex`, they share **one** sequence for that arena. Ordering is:

1. **Round** ascending (all of round 0, then all of round 1, …).
2. Within each round, **group order**: an ordered list of `groupId`s for that arena (default: order of groups in the tournament list until a saved arena order exists).
3. Within each `(round, group)` bucket: matches follow bracket order (`matchIndex`, with third-place before final on the final round when that toggle is on). Optional per-match `arenaSequenceRank` can override order inside that bucket.

Example: Groups **A** and **B** on Arena 1, same structure, group order `[A, B]`. Match `round` is zero-based (the canvas labels `round === 0` as **Round 1**, then **Semifinal**, **Final**, etc.):

- `round === 0` (first bracket round) for A: 101–104
- `round === 0` for B: 105–108
- `round === 1` (semifinals) for A: 109–110
- `round === 1` for B: 111–112
- …and so on for later rounds.

## Builder UI labels

- **Round 0**, empty athlete slot: show **Open** (not a “winner” placeholder).
- **Round ≥ 1**, empty athlete slot: show `**Winner {n}`**, where `**n**` is the **display number** of that side’s **feeder match** in the same group, resolved using the **shared arena map\*\* above so `n` matches arena scheduling across all groups on that arena.
- Full match titles elsewhere may use **Match {n}** (same `n`).
