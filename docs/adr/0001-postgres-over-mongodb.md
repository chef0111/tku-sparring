# ADR 0001: PostgreSQL (Neon) over MongoDB

## Status

Accepted — 2026-06-04

## Context

The TKU Sparring schema is relational: tournaments, groups, matches, athletes, FK constraints, and multi-step `$transaction` flows. The app was stored on MongoDB Atlas with Prisma 6, `db push`, and Mongo-specific query filters (`isSet: false`).

Prisma 7 does not support MongoDB; staying on Mongo pinned the project to Prisma 6.19 indefinitely. Future reporting and SQL tooling also favor a relational store.

## Decision

Migrate to **Neon PostgreSQL** with:

- **Prisma 7** and `@prisma/adapter-neon` for the app runtime (pooled `DATABASE_URL`)
- **`DIRECT_DATABASE_URL`** for `prisma migrate` and one-off scripts
- **UUID** primary keys for all entities (new IDs on cutover; no preservation of ObjectId hex)
- **Prisma Migrate** instead of `db push`
- **Better Auth** `prismaAdapter` with `provider: 'postgresql'` and `generateId: 'uuid'`

## Consequences

### Positive

- Prisma 7 LTS path and driver-adapter model aligned with Vercel serverless
- Enforced FK integrity and versioned migrations
- Portable Prisma filters; removed Mongo-only `isSet` branches
- Direct SQL access for analytics later

### Negative

- **All users must sign in again** after ETL (new `User.id` values)
- Bookmarks and client caches holding old ObjectIds are invalid
- One-time ETL script and maintenance window for production cutover
- ETL / migrate scripts use `@prisma/adapter-pg` on the direct URL (Neon serverless pool can hang on long batch jobs)

## Alternatives considered

| Option                                | Why not                                                |
| ------------------------------------- | ------------------------------------------------------ |
| Stay on Mongo + Prisma 6              | Blocks Prisma 7; schema already relational-on-document |
| Preserve ObjectId strings in Postgres | Rejected; clean UUID cutover chosen                    |
| Prisma Accelerate                     | Deferred; Neon pooler sufficient at current scale      |
