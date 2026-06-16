# Application Layer

- Owns backend use-cases, workflow orchestration, authorization policy, transactions, and repository port interfaces.
- Layout per domain slice: `use-cases/` for orchestration, `repositories/` for workflow-scoped port types (not one repository per entity).
- May import domain rules and repository port types from the same slice.
- Must not import oRPC procedures, React, TanStack Query, or UI modules.
- Must not import Prisma or generated Prisma client directly; use infrastructure adapters through ports.
