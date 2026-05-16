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

**Custom match**:
A **Match** in a **Group** with `kind = custom`: same scoring, claims, and Advance Settings listing rules as a bracket match, but it **does not** feed winners into the single-elimination tree. Uses an admin-chosen **display label** unique within the tournament (and must not collide with arena `Match {n}` labels on that group’s arena). Stored outside the bracket canvas layout (round band reserved in data).
_Avoid_: Friendly, scrimmage (too vague)

**Match transition**:
A rules-only change from one **Match** state to another, including score edits, admin status changes, winner overrides, and whether bracket advancement must be applied or cleared.
_Avoid_: Match patch, score helper

**AthleteProfile**:
A global athlete identity record shared across tournaments.
_Avoid_: Player, user

**Profile photo (`image`)**:
Optional public HTTPS URL of the athlete’s photo on **AthleteProfile**; **TournamentAthlete** stores a snapshot of the same URL when the athlete is added to a tournament.

**TournamentAthlete**:
A per-tournament participation record that links an AthleteProfile to a tournament and (optionally) a group.
_Avoid_: Competitor

**Arena match claim**:
A short-lived server-side reservation tying one **Match** to one **deviceId** (and user) so Advance Settings cannot finalize the same bout on two devices at once. Enforced in `ArenaMatchClaim` with TTL and heartbeats; distinct from any group-wide lock.
_Avoid_: Group lease, checkout, “group control”

**Tournament realtime (WebSocket)**:
A per-tournament **Socket.io** room (`tournament:{id}`) on the external **realtime service**; clients refetch Advance selection and related match data after `invalidate` events. The main app notifies that service over **HTTPS** (`POST /internal/broadcast`); payloads are coarse invalidation hints, not authoritative state. See `docs/tournament-realtime.md`.
_Avoid_: Lease stream, SSE (removed)

**Match Label**:
A human-readable match identifier that encodes arena and sequence (e.g., Match 101).
_Avoid_: Match code

**Third-Place Match**:
A dedicated match between the semifinal losers to determine third place in a group. It is only materialized when the group has **at least four athletes** and the per-group toggle is on.
_Avoid_: Consolation bout

**Advance Settings**:
The client-side selection flow for tournament, group, and match used before a bout starts.
_Avoid_: Setup wizard

## Relationships

- A **Tournament** contains many **Groups**.
- A **Group** contains many **Matches** (bracket shell rows and optional **Custom matches**).
- A **TournamentAthlete** belongs to exactly one **Tournament** and one **AthleteProfile**.
- At most one active **Arena match claim** row exists per **Match** (non-expired); it references `matchId`, `groupId`, `tournamentId`, `deviceId`, `userId`.
- There is **no** group-level control lease or takeover queue in the current product model.
- An **Arena** runs one **Group** at a time in the MVP workflow.
- A **Match Label** encodes the arena index and the per-arena sequence number.
- A **Third-Place Match** belongs to a **Group** and is created only when the group toggle is enabled **and** the group has at least four athletes assigned.

## Example dialogue

> **Dev:** "When two devices pick the same **Match** in **Advance Settings**, who wins?"
> **Domain expert:** "The server keeps one **Arena match claim** per match—the first Apply wins until they finish or the claim TTL expires; the other device sees that row **In use** and picks a different match."

## Flagged ambiguities

- Historic docs referred to **Group Control Lease** and a **Takeover Queue**; **superseded** by per-match **`ArenaMatchClaim`** + tournament realtime (`docs/sse-group-control-lease.md`, `docs/tournament-realtime.md`, `PRD.md` §MVP / arena flow).
- UI label for the holder row: **Reserved** (this device); **In use** (other device)—see Advance Settings combobox `Status`.
