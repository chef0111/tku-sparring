# TKU Sparring System

The TKU Sparring System manages taekwondo tournaments, including athlete rosters, division assignments, brackets, and match operations. This context defines the domain language used by admins and developers.

## Language

**Tournament**:
A competition event that contains multiple divisions and matches.
_Avoid_: Event, season

**Division**:
A weight/age/gender bucket within a tournament that contains a single-elimination bracket.
_Avoid_: Group, pool, bracket

**Arena**:
A physical ring or station where a division runs its matches in parallel with other arenas.
_Avoid_: Court, mat

**Match**:
A single contest between two athletes within a division bracket.
_Avoid_: Game, bout

**Custom match**:
A **Match** in a **Division** with `kind = custom`: same scoring, claims, and Advance Settings listing rules as a bracket match, but it **does not** feed winners into the single-elimination tree. Uses an admin-chosen **display label** unique within the tournament (and must not collide with arena `Match {n}` labels on that division’s arena). Stored outside the bracket canvas layout (round band reserved in data). **Regenerate bracket** for that **Division** deletes every **Match** row (bracket shell and **custom** rows) and recreates an empty bracket shell.
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
A per-tournament participation record that links an AthleteProfile to a tournament and (optionally) a division.
_Avoid_: Competitor

**Arena match claim**:
A server-side reservation tying one **Match** to one **deviceId** (and user) so Advance Settings cannot finalize the same bout on two devices at once. Created on Apply via `arenaMatchClaim.claim`; held until the device Applies another match in the same **Division** (prior claim released), calls `arenaMatchClaim.release`, or the row expires (30-minute TTL).
_Avoid_: Division lease, checkout, “division control”, heartbeat

**Tournament realtime**:
A per-tournament **Socket.io** room (`tournament:{id}`) on the external **realtime service**; clients refetch Advance selection and related match data after `invalidate` events. The main app notifies that service over **HTTPS** (`POST /internal/broadcast`); payloads are coarse invalidation hints, not authoritative state. See `docs/tournament-realtime.md`.
_Avoid_: Lease stream, SSE

**Match Label**:
A human-readable match identifier that encodes arena and sequence (e.g., Match 101).
_Avoid_: Match code

**Third-Place Match**:
A dedicated match between the semifinal losers to determine third place in a division. It is only materialized when the division has **at least four athletes** and the per-division toggle is on.
_Avoid_: Consolation bout

**Corner swap**:
An admin inverts red/blue corners on an upper-round **Match** (round > 0) without changing which athletes compete. Stored as `cornersSwapped` on the **Match**; when true, feeder placeholders and winner advancement use the inverted corner mapping so **`Winner {n}`** labels and advancers land on the correct side.
_Avoid_: Side flip, mirror match

**Bracket canvas**:
The builder visualization of a **Division** single-elimination tree: two **wings** (left and right) converge on a centered **Final**; optional **Third-Place Match** sits below the final. Wings are a display partition only — progression still follows `(round, matchIndex)` on the server.
_Avoid_: Bracket panel, tree view

**Wing** (bracket canvas):
The left or right half of the canvas subtree that feeds one semifinal side. Left-wing nodes read left-to-right; right-wing nodes read right-to-left. Applies only when **Canvas layout** is `two-sided`.
_Avoid_: Side, hemisphere

**Canvas layout**:
Admin view setting for the **Bracket canvas**: `two-sided` (default) or `one-sided` (classic left-to-right tree). Stored per device in the browser only — not on **Tournament** or **Division**.
_Avoid_: Bracket mode, layout toggle

**Bracket screenshot**:
Exports the full **Division** tree from the **Bracket canvas** as a light-mode PNG at fit-to-content scale (not the current pan/zoom viewport), on a plain white background. Copy or save without closing the preview dialog.
_Avoid_: Canvas export, bracket image

**Bracket fullscreen**:
Immersive **Bracket canvas** view that hides builder chrome until the admin hovers the top (header), bottom (footer), or left edge (**Divisions** panel). Esc exits unless a dialog or sheet is open.
_Avoid_: Presentation mode, zen mode

**Advance Settings**:
The client-side selection flow for tournament, division, and match used before a bout starts.
_Avoid_: Setup wizard

**Operations hub**:
`/dashboard` — cross-tournament KPIs, status pipeline, needs-attention, recent table.
_Avoid_: Home dashboard, admin home

**Command center**:
`/dashboard/tournaments/$id` — per-tournament monitoring, setup checklist (draft), lifecycle actions; editing stays on **Builder**.
_Avoid_: Tournament detail, viewer

## Persistence

The system stores data in **PostgreSQL** (Neon). Entity primary keys are **UUIDs**. Prisma migrations live under `prisma/migrations/`.

## Naming conventions (code)

Prefer **short imperative** names for APIs and modules, but keep **semantics** aligned with the domain terms above — a reader should still see what concept is acted on (e.g. a **Match**, a **round**), not only that something runs. See `.cursor/rules/concise-naming.mdc` for project-wide rules (functions, variables, constants, types).

**oRPC vs queries folders:** `src/orpc` often uses plural directory names (`divisions/`, `matches/`); `src/queries` uses singular domain folders (`division/`, `match/`). Router keys (`client.division`, `client.tournament`, …) are stable — see `.cursor/rules/orpc.mdc` and `docs/specs/2026-05-28-orpc-layout-design.md`.

**Backend domain style:** Tournament rules are **functional** — pure functions, schemas, and value types (e.g. match transition plans, bracket progression), not entity classes with methods. Rules live in `src/lib/tournament/**` during migration and move into `src/server/domain/**` only when a vertical slice naturally touches them. oRPC is the sole transport boundary; application use-cases orchestrate policy and call infrastructure through workflow-scoped repository ports. See `docs/adr/0002-strict-clean-architecture-for-orpc-backend.md`.

**Backend slice layout:** Each domain under `src/server` uses vertical folders with `use-cases/` and `repositories/` subfolders (e.g. `application/matches/use-cases/`, `application/matches/repositories/`, `infrastructure/matches/repositories/`). Repository ports stay **workflow-scoped** (e.g. match transition, custom match) — not one aggregate repository per entity.

**Backend composition:** Prisma is an app-scoped singleton (`src/lib/db.ts`). Repository adapters are stateless singletons built in infrastructure and wired on oRPC `context.repos` at the RPC handler — procedures pass ports into use-cases; they do not import infrastructure. Auth (`user`, `session`) is already request-scoped via oRPC middleware.

**Error boundary:** Typed RPC errors are defined on `src/orpc/base` and thrown in oRPC handlers (`errors.NOT_FOUND`, etc.). Application use-cases throw small error classes (`NotFoundError`, `PolicyViolationError`); procedures map via `mapAppError`. Deprecate and delete `src/orpc/errors.ts` when imports reach zero.

## Relationships

- A **Tournament** contains many **Divisions**.
- A **Division** contains many **Matches** (bracket shell rows and optional **Custom matches**).
- A **TournamentAthlete** belongs to exactly one **Tournament** and one **AthleteProfile**.
- At most one active **Arena match claim** row exists per **Match** (non-expired); it references `matchId`, `divisionId`, `tournamentId`, `deviceId`, `userId`.
- There is **no** division-level control lease or takeover queue in the current product model.
- An **Arena** runs one **Division** at a time in the MVP workflow.
- A **Match Label** encodes the arena index and the per-arena sequence number.
- A **Third-Place Match** belongs to a **Division** and is created only when the division toggle is enabled **and** the division has at least four athletes assigned.

## Example dialogue

> **Dev:** "When two devices pick the same **Match** in **Advance Settings**, who wins?"
> **Domain expert:** "The server keeps one **Arena match claim** per match—the first Apply wins until they finish or the claim TTL expires; the other device sees that row **In use** and picks a different match."

## Flagged ambiguities

- UI label for the holder row: **Reserved** (this device); **In use** (other device)—see Advance Settings combobox `Status`.
