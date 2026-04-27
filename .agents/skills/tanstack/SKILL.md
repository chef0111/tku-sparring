---
name: tanstack
description: 'Select and load the correct TanStack skill for tku-sparring tasks. Use when users ask about TanStack Router, React Start, Start server functions or middleware, SSR, search params, path params, navigation, loaders, or TanStack Query best practices.'
argument-hint: 'Describe the TanStack task to route to the right skill'
---

# TanStack Skill Router

Route TanStack-related requests to the right specialized skill before implementing code changes.

## When To Use

- User asks a TanStack question and the right skill is unclear
- Task mentions Router, Start, React Start, server functions, middleware, SSR, route params, or query caching
- You need to choose one primary TanStack skill and optional secondary skills

## Workflow

1. Extract task intent from the user request.
2. Match intent to the primary skill using the decision table.
3. Load the primary skill first using Bun.
4. Load one secondary skill only if the task clearly spans multiple domains.
5. Implement changes and verify with tests/lint if applicable.

## Skill Selection Table

| Task signal in prompt | Primary skill to load | Optional secondary |
| --- | --- | --- |
| Route tree, createRouter, Link, useNavigate, search params, path params, loader, route guards, router type issues | `@tanstack/router-core#router-core` or a `router-core/*` sub-skill | `@tanstack/start-client-core#start-core` when task includes TanStack Start runtime behavior |
| Auth guards with `beforeLoad`, redirects, protected layout routes | `@tanstack/router-core#router-core/auth-and-guards` | `tanstack-start-best-practices` local skill for full-stack auth/session constraints |
| Search params parsing/validation, Zod adapters, URL state | `@tanstack/router-core#router-core/search-params` | `tanstack-query-best-practices` local skill when params drive query keys |
| Dynamic route params, splats, optional segments | `@tanstack/router-core#router-core/path-params` | none |
| Loader behavior, pending states, route-level data loading | `@tanstack/router-core#router-core/data-loading` | `tanstack-query-best-practices` local skill when data cache is TanStack Query |
| TanStack Start app wiring, Vite plugin order, route shell, `getRouter` setup | `@tanstack/start-client-core#start-core` | `@tanstack/react-start#react-start` |
| Server function creation, input validation, `useServerFn`, server-only logic | `@tanstack/start-client-core#start-core/server-functions` | `tanstack-start-best-practices` local skill |
| Request/function middleware, context flow, createMiddleware, method order | `@tanstack/start-client-core#start-core/middleware` | `tanstack-start-best-practices` local skill |
| Server routes and HTTP handlers (`GET`, `POST`, etc.) | `@tanstack/start-client-core#start-core/server-routes` | `tanstack-start-best-practices` local skill |
| Execution boundary issues (server/client leakage, env variables, hydration mismatches) | `@tanstack/start-client-core#start-core/execution-model` | `tanstack-start-best-practices` local skill |
| Deployment adapters, selective SSR, prerendering | `@tanstack/start-client-core#start-core/deployment` | `tanstack-start-best-practices` local skill |
| Query keys, stale time, cache invalidation, optimistic updates, SSR dehydration | `tanstack-query-best-practices` local skill | `@tanstack/router-core#router-core/data-loading` when route loaders and query cache interact |
| Full-stack TanStack Start governance (security, auth, SSR, API routes, file separation) | `tanstack-start-best-practices` local skill | `@tanstack/start-client-core#start-core` |

## Loading Commands

Use Bun scripts in this repository.

```bash
bun run intent:load @tanstack/router-core#router-core
bun run intent:load @tanstack/start-client-core#start-core
bun run intent:load @tanstack/start-client-core#start-core/server-functions
```

For local workspace skills (not intent package skills), open directly:

- `./.agents/skills/tanstack-query-best-practices/SKILL.md`
- `./.agents/skills/tanstack-start-best-practices/SKILL.md`
- `./.agents/skills/react-start/SKILL.md`

## Decision Rules

- Prefer the most specific sub-skill over a broad parent skill.
- Do not load more than 2 skills unless the user explicitly asks for a broad architecture review.
- If both Router and Start apply, choose Start only when server/runtime behavior is required.
- If task is mostly cache policy and data consistency, prioritize query best-practices.

## Completion Checks

- Selected skill matches the core task language from the user prompt.
- Load command uses the canonical `use` value.
- Any secondary skill is justified in one sentence.
- Planned implementation references constraints from the loaded skill.

## Fallback

If no mapping fits, list current discoverable intent skills and pick the closest match:

```bash
bun run intent:ls
```
