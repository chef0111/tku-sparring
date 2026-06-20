# oRPC Layout Refactor — Design Spec

**Date:** 2026-05-28  
**Status:** Approved for implementation  
**Reference:** `src/queries/` (completed layer refactor)

## Goal

Make `src/orpc` as navigable and layered as `src/queries`: clear seams between router assembly, procedures, DTOs, DAL, and use-cases; domain colocation; concise names; one commit per logical step.

Client consumption stays in `src/queries/api/*-api.ts` → `@/orpc/client`. TanStack Query does not move into oRPC.

## Non-goals

- Change `client.*` router keys (breaking RPC contract)
- Rename domain folders (`divisions/` stays plural; `queries/division/` stays singular)
- Remove router procedures (including low-use `division.get`, `match.get`, etc.)
- Add `queries/api` for `arenaMatchClaim`, `device`, or `tournamentAthlete.bulkRemove` in this refactor
- Extract Prisma out of oRPC or split microservices
- Duplicate Zod DTOs under `src/queries`

## Layers

| Layer           | Location                                   | Responsibility                                                    |
| --------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| Router assembly | `src/orpc/router.ts`, `<domain>/router.ts` | Map `client.*` keys only; no business logic                       |
| Procedures      | `<domain>/index.ts`                        | `authorized` + input schema + delegate                            |
| DTOs            | `<domain>/dto.ts`                          | Zod schemas; imported by procedures and `queries/api`             |
| DAL             | `<domain>/dal.ts`                          | Prisma / persistence                                              |
| Use-cases       | `<domain>/*.ts` (e.g. `bulk-add.ts`)       | Multi-step / cross-DAL orchestration; procedures call in one line |
| Tests           | `<domain>/__tests__/`                      | Colocated                                                         |

## Router fragment pattern

Each domain exports a const router object from `<domain>/router.ts`. Root `router.ts` imports fragments and merges only.

`matches/` exports two fragments:

- `matchRouter` → `client.match.*`
- `bracketRouter` → `client.bracket.*`

Use `as const` on fragments for stable `RouterClient` inference. Domain `router.ts` imports from `./index`, never the reverse (avoid circular imports).

## Folder map (intentional plural vs singular)

| `client.*`             | oRPC folder              | queries folder         |
| ---------------------- | ------------------------ | ---------------------- |
| `tournament`           | `tournaments/`           | `tournament/`          |
| `division`             | `divisions/`             | `division/`            |
| `match`, `bracket`     | `matches/`               | `match/`               |
| `athleteProfile`       | `athlete-profiles/`      | `athlete-profile/`     |
| `tournamentAthlete`    | `tournament-athletes/`   | `tournament-athlete/`  |
| `activity`             | `activity/`              | `activity/`            |
| `advanceSettings`      | `advance-settings/`      | `advance-settings/`    |
| `arenaMatchClaim`      | `arena-match-claim/`     | _(no api adapter yet)_ |
| `device.lastSelection` | `device-last-selection/` | _(no api adapter yet)_ |

## Reserved procedures

**`tournamentAthlete.bulkRemove`** stays on the router for a future builder “remove athletes from tournament” feature. When implemented: add `bulkRemove` to `tournament-athlete-api.ts`, mutation hook, and an `invalidateOn*` cache recipe in the tournament-athlete domain.

## Verification

Per commit:

```bash
bun run test
bunx tsc --noEmit
bun run lint
```

Smoke (unchanged RPC paths):

- Tournament builder: divisions, add-athletes sheet, brackets
- Advance settings arena selection
- Athlete library CRUD
