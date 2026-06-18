# Infrastructure Layer

- Owns adapters for persistence, activity logging, realtime publishing, Better Auth, and session providers.
- Layout per domain slice: `repositories/` holds Prisma implementations of application repository ports.
- May import application repository port types and external provider clients.
- Implements side effects behind application-owned interfaces.
- Must not be imported by domain modules.
