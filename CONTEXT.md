# TKU Sparring System

The TKU Sparring System manages taekwondo tournaments, including athlete rosters, group assignments, brackets, and match operations. This context defines the domain language used by admins and developers.

## Language

**Tournament**:
A competition event that contains multiple groups and matches.
_Avoid_: Event, season

**Group**:
A division within a tournament that contains a single-elimination bracket.
_Avoid_: Pool, bracket

**Arena**:
A physical ring or station where a group runs its matches in parallel with other arenas.
_Avoid_: Court, mat

**Match**:
A single contest between two athletes within a group bracket.
_Avoid_: Game, bout

**AthleteProfile**:
A global athlete identity record shared across tournaments.
_Avoid_: Player, user

**TournamentAthlete**:
A per-tournament participation record that links an AthleteProfile to a tournament and (optionally) a group.
_Avoid_: Competitor

**Group Control Lease**:
A short-lived lock that marks a group as actively controlled by a specific admin device in the arena.
_Avoid_: Reservation, checkout

**Match Label**:
A human-readable match identifier that encodes arena and sequence (e.g., Match 101).
_Avoid_: Match code

**Advance Settings**:
The client-side selection flow for tournament, group, and match used before a bout starts.
_Avoid_: Setup wizard

## Relationships

- A **Tournament** contains many **Groups**.
- A **Group** contains many **Matches**.
- A **TournamentAthlete** belongs to exactly one **Tournament** and one **AthleteProfile**.
- A **Group Control Lease** belongs to a **Group** and is held by one admin device at a time.
- An **Arena** runs one **Group** at a time in the MVP workflow.
- A **Match Label** encodes the arena index and the per-arena sequence number.

## Example dialogue

> **Dev:** "If a **Group** is selected in **Advance Settings**, should we create a **Group Control Lease**?"
> **Domain expert:** "Yes, selecting a group should mark it as in use so other arenas can see it."
