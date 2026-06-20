# Rename Group to Division

Status: Accepted — 2026-06-20

## Context

The domain glossary originally used **Group** for a tournament bracket bucket, while product copy and martial-arts operators expect **Division** (weight/age/gender class). The codebase mixed both terms — command-center copy already said "divisions" while schema, oRPC, and builder UI said "group".

## Decision

Perform a full-stack rename:

- PostgreSQL: table `group` → `division`, columns `groupId` → `divisionId`, `arenaGroupOrder` → `arenaDivisionOrder`
- oRPC: `client.group` → `client.division` (breaking change; monorepo deploys admin + arena together)
- Server, contracts, queries, and UI symbols aligned on **Division**

Activity audit rows (`eventType`, `entityType`) are backfilled in the migration SQL.

## Alternatives considered

- **UI-only rename** — rejected; developers would still read `Group` in code while admins see Division
- **Keep stable `client.group`** — rejected; perpetuates dual vocabulary and confuses new contributors

## Consequences

- Single atomic deploy: run migration then app, or CI migrate-before-start
- Builder URL search param changes from `?group=` to `?division=`
- TanStack Query keys reset (`['group']` → `['division']`)
- Arena localStorage reads legacy `groupId` once for backward compat on device selection
