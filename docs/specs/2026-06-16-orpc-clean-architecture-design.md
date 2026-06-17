# oRPC Clean Architecture Design

## Goal

Move the backend behind `src/orpc` to strict Clean Architecture without breaking public oRPC router keys.

## Non-goals

- Do not split into microservices.
- Do not replace oRPC.
- Do not move TanStack Query adapters out of `src/queries`.
- Do not migrate every domain in one PR.

## Layers

| Layer          | Location                                                                          | Responsibility                                                                          |
| -------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Transport      | `src/orpc/**`                                                                     | oRPC procedure input parsing, auth context extraction, stable router keys               |
| Application    | `src/server/application/**`                                                       | use-cases, transactions, authorization, lifecycle policy, ports                         |
| Domain         | `src/server/domain/**` and existing pure `src/lib/tournament/**` during migration | pure rules, value objects, status transitions, domain errors                            |
| Infrastructure | `src/server/infrastructure/**`                                                    | Prisma repositories, activity logging, realtime publisher, Better Auth/session adapters |

## Dependency Rule

`src/orpc` may import application use-cases. Application may import domain and repository port types. Infrastructure may import application repository port types and external providers. Domain must not import oRPC, Prisma, React, TanStack Query, or generated Prisma client.

**oRPC procedures must not import `@/server/infrastructure/**`.\*\* Repository implementations are wired at the composition root (see below).

## Composition root (oRPC context)

oRPC is the transport boundary and the **composition root** for backend dependencies:

| Dependency                   | Scope         | Where wired                                                                  |
| ---------------------------- | ------------- | ---------------------------------------------------------------------------- |
| `headers`, `user`, `session` | Per request   | `api.rpc.$.ts` seeds headers; auth middleware adds session                   |
| `prisma`                     | App singleton | `src/lib/db.ts` (`globalThis` — Prisma best practice)                        |
| Repository adapters          | App singleton | Built in infrastructure; attached to `context.repos` once at the RPC handler |

Wire repository ports in `src/routes/api.rpc.$.ts` (or a dedicated server module it imports). Procedures pass `context.repos.<name>` into use-cases — no separate DI container class.

```typescript
// api.rpc.$.ts
context: { headers: request.headers, repos: serverRepos }

// procedure
return runUpdateMatchScore(
  { ...input, adminId: context.user.id },
  context.repos.matchTransition,
);
```

Use-cases stay plain functions with the port as an argument so unit tests can inject mocks without oRPC.

## Slice layout

Organize each vertical slice under a domain folder with dedicated subfolders:

```
src/server/application/<domain>/
  use-cases/          # orchestration (plain functions)
  repositories/       # workflow-scoped port interfaces + row/command types
src/server/infrastructure/<domain>/
  repositories/       # Prisma adapters implementing those ports
```

Example (match transition):

```
application/matches/use-cases/transition.ts
application/matches/repositories/transition.ts   # MatchTransitionStore
infrastructure/matches/repositories/transition.ts
```

Repository ports are **workflow-scoped** (e.g. `MatchTransitionStore`, `CustomMatchStore`), not one repository per Prisma model. Command/DTO types may live beside use-cases or in `repositories/` when shared with the port.

## Migration Rules

1. Plans 004 and 005 must be DONE before moving implementation code.
2. Migrate by vertical slice.
3. Keep router keys stable unless an API migration plan says otherwise.
4. Keep DTO compatibility at the oRPC boundary during each slice.
5. Add characterization tests before moving a workflow.
6. Remove legacy DAL facades only after callers have moved.
7. **Before slice 2:** restructure slice 1 (match transition) into the slice layout above — layout-only commit, no behavior change; run full verification gates.
8. **Before slice 2 (same or follow-up commit):** wire repository adapters on `context.repos` at the RPC handler; remove `@/server/infrastructure` imports from oRPC procedures.
9. **Before slice 2:** move `tournament-policy` to `src/server/application/policies/`. Application must not import `@/orpc/errors` — use-cases throw or return neutral application failures; oRPC procedures map them to typed `errors.*` from `src/orpc/base.ts` in the handler (see Error boundary below).

## Error boundary

Typed oRPC errors live on **`src/orpc/base`** (`.errors({ NOT_FOUND, BAD_REQUEST, … })`). Procedures throw via the handler `errors` argument:

```typescript
.handler(async ({ input, context, errors }) => {
  // ...
  throw errors.NOT_FOUND({ message: 'Match not found' });
});
```

Application use-cases **must not** import `@/orpc/errors` or use handler `errors`. They signal failure with **application error classes** in `src/server/application/errors.ts` (e.g. `NotFoundError`, `PolicyViolationError`). Procedures catch or use `mapAppError(errors, e)` in `src/orpc/` to throw typed `errors.*`.

**Remove `src/orpc/errors.ts`** once nothing imports it (phased — see migration rule 10). `src/orpc/base.ts` is the error catalog; handlers use `errors` from the handler context. **Middleware** has no handler `errors` — throw `new ORPCError('UNAUTHORIZED', { message, defined: true })` (codes must match `base.errors`). Unmigrated DAL/use-case call sites migrate per vertical slice.

10. **Phased removal of `src/orpc/errors.ts`:** delete the file only when zero imports remain. Pre-slice-2: middleware (`ORPCError`), match-transition procedures + application errors, policy move. Legacy DALs migrate with their slice.

## First Slices

1. Match transition write.
2. Custom match create/delete.
3. Group lifecycle and assignment.
4. Bracket lifecycle.
5. Tournament lifecycle and arena order.
6. Tournament athletes, Advance Settings, and device last selection.
