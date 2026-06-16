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

`src/orpc` may import application use-cases. Application may import domain and port types. Infrastructure may import application port types and external providers. Domain must not import oRPC, Prisma, React, TanStack Query, or generated Prisma client.

## Migration Rules

1. Plans 004 and 005 must be DONE before moving implementation code.
2. Migrate by vertical slice.
3. Keep router keys stable unless an API migration plan says otherwise.
4. Keep DTO compatibility at the oRPC boundary during each slice.
5. Add characterization tests before moving a workflow.
6. Remove legacy DAL facades only after callers have moved.

## First Slices

1. Match transition write.
2. Custom match create/delete.
3. Group lifecycle and assignment.
4. Bracket lifecycle.
5. Tournament lifecycle and arena order.
6. Tournament athletes, Advance Settings, and device last selection.
