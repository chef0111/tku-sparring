# Application Layer

- Owns backend use-cases, workflow orchestration, authorization policy, transactions, and application ports.
- May import domain rules and application port types.
- Must not import oRPC procedures, React, TanStack Query, or UI modules.
- Must not import Prisma or generated Prisma client directly; use infrastructure adapters through ports.
