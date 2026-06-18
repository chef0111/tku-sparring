# Domain Layer

- Owns pure backend rules, value objects, status transitions, and domain errors.
- May use existing pure `src/lib/tournament/**` rules during migration.
- Must stay independent of transport, persistence, auth providers, realtime, and UI concerns.
- Must not import oRPC, Prisma, React, TanStack Query, or generated Prisma client.
