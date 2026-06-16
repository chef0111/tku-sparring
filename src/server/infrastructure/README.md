# Infrastructure Layer

- Owns adapters for persistence, activity logging, realtime publishing, Better Auth, and session providers.
- May import application port types and external provider clients.
- Implements side effects behind application-owned interfaces.
- Must not be imported by domain modules.
