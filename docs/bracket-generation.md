# Bracket Generation

This document captures bracket generation behavior and match labeling for the tournament builder.

## Bracket Materialization

- Bracket generation creates the full single-elimination tree up front for a group.
- All rounds are materialized in Draft so the SVG canvas is deterministic.

## Match Linkage

- Each Match stores explicit `redSourceMatchId` and `blueSourceMatchId` for derived rounds.
- Round 1 matches store the initial seed assignments.

## Third-Place Match

- When enabled, a dedicated Third-Place Match is created and wired to the semifinal losers.
- The Third-Place Match is part of the bracket canvas and audit trail.

## Match Label Sequence

- Match labels follow the arena sequence (e.g., Match 101, 102, ...).
- The Third-Place Match is placed immediately before the Final in the sequence.
- Example for an 8-athlete bracket in Arena 1: Match 107 (Third-Place), Match 108 (Final).
