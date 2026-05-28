# Handoff: `src/orpc` refactor (queries-inspired)

**Date:** 2026-05-27  
**Branch:** `staging` (verify with `git branch --show-current`)  
**Next focus:** Refactor `src/orpc` using the same architectural goals as the completed `src/queries` layer, guided by `/improve-codebase-architecture`.

---

## Goal for the next session

Make **`src/orpc`** as navigable and layered as **`src/queries`**: clear seams between router assembly, procedure definitions, DTOs, and DAL; domain colocation; concise names; one commit per logical step. **Do not** move TanStack Query into oRPC — client consumption stays in `src/queries/api/*-api.ts` → `@/orpc/client`.

---

## What was completed (queries — use as template)

Recent commits on `staging` (newest first, queries-related):

| Commit     | Summary                                                                        |
| ---------- | ------------------------------------------------------------------------------ |
| `f287b3e`  | `invalidateOnBulkAdd` recipe colocated in tournament-athlete invalidate module |
| `ced24c4`  | Flat `src/queries/api/*-api.ts` + `src/queries/optimistic-updates/`            |
| `af6f859`  | Domain folders, removed `src/lib/queries` and flat re-export barrels           |
| `7f0c578`+ | Split hooks, `*QueryOptions`, invalidation per domain                          |
| `73e5910`  | `keys.ts`, `query-client.ts`, `.cursor/rules/tanstack-query.mdc`               |

**Target `src/queries` layout (reference implementation):**

```
src/queries/
  keys.ts, query-client.ts, session.ts
  api/                    # thin oRPC client adapters only
  optimistic-updates/     # cache-only (match.ts today)
  <domain>/               # hooks, *QueryOptions, invalidate-*-cache.ts, index.ts barrel
```

**Cursor rules:** `.cursor/rules/tanstack-query.mdc`  
**Naming:** `.cursor/rules/concise-naming.mdc` (`alwaysApply: true`) — linked from `CONTEXT.md`  
**Domain language:** `CONTEXT.md` (Tournament, Group, Match, TournamentAthlete, …)

**Deliberate decisions (don’t re-litigate without user):**

- Keep domain folders **flat** under `queries/` — no `queries/domains/` wrapper (shallow pass-through).
- `api/` and `<domain>/` are **sibling layers** (adapters vs React Query surface), not nested under one parent.
- Cross-domain cache recipes: `invalidateOn{Effect}` in originating domain’s invalidate file (see `invalidateOnBulkAdd`).

**Bug fixed en route:** bulk add did not invalidate `athleteProfile` keys → add-athletes sheet `allInTournament` stale until refresh (`403a1d5`, then `invalidateOnBulkAdd` in `f287b3e`).

---

## Current `src/orpc` shape (starting point)

~55 files under domain folders + root:

| Path                  | Role today                                                                           |
| --------------------- | ------------------------------------------------------------------------------------ |
| `router.ts`           | Large import list + nested router map (`tournament`, `group`, `match`, `bracket`, …) |
| `client.ts`           | Isomorphic oRPC client (`client.tournament.list`, etc.)                              |
| `middleware.ts`       | `authedProcedure`                                                                    |
| `<domain>/index.ts`   | Zod input + `authedProcedure` handlers (often thin wrappers → DAL)                   |
| `<domain>/dto.ts`     | Zod schemas / types (consumed by `src/queries/api` and procedures)                   |
| `<domain>/dal.ts`     | Prisma / domain persistence                                                          |
| `<domain>/*.ts`       | Use-case modules (`bulk-add.ts`, `bracket-helpers.ts`, …)                            |
| `<domain>/__tests__/` | Colocated tests (keep this pattern)                                                  |

**Router keys vs folder names (intentional mismatch today):**

| Router key (`client.*`) | Folder under `src/orpc/` |
| ----------------------- | ------------------------ |
| `group`                 | `groups/`                |
| `match` / `bracket`     | `matches/`               |
| `tournament`            | `tournaments/`           |
| `athleteProfile`        | `athlete-profiles/`      |
| `tournamentAthlete`     | `tournament-athletes/`   |

`src/queries` uses singular folder names (`group/`, `match/`) aligned with hooks; oRPC folders are often plural. Any rename needs a **migration plan** (re-exports or single PR with import updates) — flag early.

**Example procedure stack** (`tournaments/index.ts`): `authedProcedure` → `TournamentDAL` → `dto.ts` schemas. Matches are heavier (`matches/dal.ts`, helpers, bracket endpoints split in router under `bracket` namespace).

---

## Architecture exploration agenda (`/improve-codebase-architecture`)

Run Phase 1 (explore) before coding. Read `CONTEXT.md` and `docs/adr/` if present. Apply **deletion test** to any proposed folder.

### Numbered deepening candidates (pick with user)

**1. Thin `router.ts` (assembly-only seam)**

- **Files:** `src/orpc/router.ts`, all `*/index.ts` exports
- **Problem:** Router file is the gravity well — hard to see domain boundaries; every new procedure touches a 150-line import block.
- **Solution:** Each domain exports a **router fragment** (e.g. `export const tournamentRouter = { list, get, … }`); `router.ts` only merges fragments.
- **Benefits:** **Locality** — add a procedure in one domain without editing unrelated imports; **leverage** — one place to read full API map.

**2. Split procedure surface from DAL (clarify existing seam)**

- **Files:** domains where `index.ts` mixes validation, orchestration, and DAL calls
- **Problem:** Some `index.ts` files are already thin; others may grow. Unclear where multi-step flows belong (`tournament-athletes/bulk-add.ts` vs `index.ts`).
- **Solution:** Convention: `procedures.ts` (or keep `index.ts`) = only `authedProcedure` wiring; `dal.ts` = persistence; `*.ts` = composable use-cases called by procedures (bulk add pattern). Document in `.cursor/rules/orpc.mdc` (new).
- **Benefits:** **Interface is test surface** — unit test use-cases without RPC; integration test procedures.

**3. Align domain folder names with router keys (optional, high churn)**

- **Files:** all `src/orpc/*` folders vs `src/queries/*`
- **Problem:** `groups/` vs `queries/group/` doubles mental map for agents and humans.
- **Solution:** Rename `groups` → `group` (etc.) **or** document “oRPC plural, queries singular” in CONTEXT + rule — only rename if deletion test shows real confusion.
- **Benefits:** AI-navigability; **risk:** large diff, no runtime benefit.

**4. Shared `dto` import path for client layer**

- **Files:** `src/orpc/*/dto.ts`, `src/queries/api/*-api.ts`
- **Problem:** Already good — queries import DTO types from `@/orpc/.../dto`. Ensure no duplicate Zod in queries.
- **Solution:** Rule: DTOs live only under `src/orpc`; queries never redefine input shapes.
- **Benefits:** Single source of truth (already mostly true).

**5. Bracket as sub-seam of Match**

- **Files:** `matches/index.ts`, `router.ts` `bracket` namespace
- **Problem:** `bracket.*` procedures live in matches folder but separate router tree — correct product seam, easy to lose when refactoring.
- **Solution:** `matches/bracket-procedures.ts` exported into router as `bracket: { … }` next to match procedures; or `matches/router.ts` exporting both.
- **Benefits:** **Locality** for bracket work; mirrors `queries/api/match-api.ts` calling both `client.match` and `client.bracket`.

**6. Cross-domain orchestration modules (bulk-add pattern)**

- **Files:** `tournament-athletes/bulk-add.ts`, similar
- **Problem:** Use-cases that call multiple DALs (TournamentAthlete + Group auto-assign) need a home that isn’t “fat handler.”
- **Solution:** Keep `bulk-add.ts`-style modules; procedures call them in one line (mirror `invalidateOnBulkAdd` on queries side). Name with **concise naming** (`onBulkAdd` domain, not `bulkAddAthletesToTournamentWithAutoAssign`).
- **Benefits:** **Depth** — procedure stays shallow; test targets use-case.

**Do NOT propose yet:** moving Prisma out of oRPC, splitting into microservices, or duplicating DTOs in queries.

---

## Suggested refactor sequence (after exploration sign-off)

Mirror queries refactor discipline: **one conventional commit per step**, `bun run test` + `bunx tsc --noEmit` each time.

1. **Scaffold** — `.cursor/rules/orpc.mdc` (layers, where procedures/dto/dal live, link `concise-naming.mdc`); no file moves.
2. **Router fragments** — extract per-domain router objects; `router.ts` merge only.
3. **Procedure / use-case convention** — normalize `bulk-add.ts`-style; thin `index.ts` where needed.
4. **Naming pass** — only where touching files; `invalidateAfter*` → `invalidateOn*` is queries-only but same spirit for any `*Endpoint` suffixes in matches if redundant.
5. **Folder rename** (optional last) — only if user chooses candidate #3.

Squash message style (queries):  
`refactor(orpc): centralize procedure layout and router assembly`  
(Do **not** reference external project names in commit/PR titles.)

---

## Verification checklist (per step)

```bash
bun run test
bunx tsc --noEmit
bun run lint   # 0 errors required
```

Smoke: tournament builder (groups, add-athletes sheet, brackets), advance settings, athlete library — RPC paths must stay stable (`client.*` keys unchanged unless explicitly migrating).

---

## Open follow-ups (queries, not orpc — optional)

- `invalidateOnRemove` for tournament-athlete remove (profile exclude list) — same pattern as bulk add.
- Rename legacy `invalidateAfterGroupWrite` → `invalidateOnGroupWrite` when touching those files.
- `src/orpc/tournament-athletes/index.ts` — `prisma` import reported unused by tsc (fix if still present).

---

## Skills for next session

| Skill                               | Use for                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| **`improve-codebase-architecture`** | Explore `src/orpc`, present numbered candidates, grilling before moves          |
| **`brainstorming`**                 | If user wants ADR / spec before multi-commit refactor                           |
| **`tanstack-query`**                | Only when invalidation/client calls change — keep oRPC ↔ queries contract clear |
| **`systematic-debugging`**          | If refactor breaks RPC or cache behaviour                                       |
| **Prisma skills**                   | Only if DAL/schema changes (unlikely in layout-only refactor)                   |

**Avoid starting with:** full `writing-plans` doc unless user asks — exploration + incremental commits worked well for queries.

---

## Key file pointers

| Concern               | Path                                                                    |
| --------------------- | ----------------------------------------------------------------------- |
| Router map            | `src/orpc/router.ts`                                                    |
| Client                | `src/orpc/client.ts`                                                    |
| Query adapters        | `src/queries/api/*.ts`                                                  |
| Query rules           | `.cursor/rules/tanstack-query.mdc`                                      |
| Naming rules          | `.cursor/rules/concise-naming.mdc`                                      |
| Domain terms          | `CONTEXT.md`                                                            |
| Bulk-add use-case     | `src/orpc/tournament-athletes/bulk-add.ts`                              |
| Bulk-add cache recipe | `src/queries/tournament-athlete/invalidate-tournament-athlete-cache.ts` |

---

## First message to send the next agent

> Continue the **oRPC layout refactor** on `staging`, using `src/queries` as the reference and `/improve-codebase-architecture` Phase 1 first. Read `docs/handoffs/2026-05-27-orpc-refactor-handoff.md`. Do not change `client.*` router keys without explicit approval. Start by presenting deepening candidates; implement only after I pick one.
