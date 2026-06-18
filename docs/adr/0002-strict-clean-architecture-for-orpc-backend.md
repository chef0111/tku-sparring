# Strict Clean Architecture for oRPC Backend

Status: Accepted — 2026-06-16

The MVP-era oRPC layout kept Prisma persistence inside `src/orpc` and used local action modules for multi-step workflows. That shape was appropriate while the system was still proving the product, but the post-MVP backend now has enough tournament lifecycle, match transition, audit, realtime, and authorization policy that transport, application policy, domain rules, and infrastructure need explicit dependency boundaries.

We will migrate the backend behind `src/orpc` to strict Clean Architecture by vertical slice: oRPC procedures remain the public transport contract, application use-cases own orchestration and policy, domain modules remain pure, and infrastructure adapters implement persistence and side effects. Prisma stays in the app for now, but it moves behind infrastructure adapters instead of being imported by application/domain code.

Consequences: existing `client.*` router keys remain stable during the migration; no microservice split is implied; new backend code must follow the dependency rule documented in `docs/specs/2026-06-16-orpc-clean-architecture-design.md`.
