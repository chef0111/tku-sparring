# Dashboard Redesign — Command Center + Operations Hub

**Date:** 2026-05-22  
**Status:** Approved for implementation

## Goals

1. **Command center** (`/dashboard/tournaments/$id`): Align with Operations hub visuals; remove groups progress table and client-side match-status counting (unreliable vs server `winnerId` lifecycle).
2. **Operations hub** (`/dashboard`): Add 1–2 EvilCharts using existing stats; leave pipeline, needs-attention, and recent table unchanged.

## Visual system

Reuse primitives from [`src/features/dashboard/home/components/hub-panel.tsx`](../../src/features/dashboard/home/components/hub-panel.tsx):

| Primitive                          | Use                                                          |
| ---------------------------------- | ------------------------------------------------------------ |
| `HubMetricCard`                    | Command center KPI row (mirror `kpi-strip.tsx`)              |
| `HubChartPanel`                    | Operations hub chart containers (new, same 2-layer language) |
| `HubSection` / `HubSectionContent` | Groups overview, setup checklist, activity                   |

Tone: industrial/utilitarian — Geist, zinc semantic tokens, radial gradient card insets. Charts use hub status colors (degraded / online / maintenance).

## Command center

### Removed

- `GroupsProgressTable`, `MatchProgressBar`, `stat-card.tsx`
- `groupProgress`, `MatchTotals`, `countByStatus` from `compute-command-center.ts`
- 4th KPI tile (match progress bar)

### Kept

- `setupSteps` in compute layer (draft checklist)
- Matches prefetch for bracket setup step

### Layout

```
Header → [Alert] → Setup checklist → HubMetricCard ×3 → Groups grid (3 col) + Activity (2 col)
```

### Groups overview

Card grid inside `HubSection`. Each card: name, arena badge, athlete count, match count (`_count` only), Builder link. No progress bars.

### KPI footers

| Tile     | Footer                                          |
| -------- | ----------------------------------------------- |
| Groups   | Arena count from max `arenaIndex`               |
| Athletes | Optional minimal footer                         |
| Matches  | Lifecycle: Setup / In progress / Ready / Locked |

### Copy fix

Ready-to-complete alert: _"Every match has a recorded winner. You can complete this tournament when ready."_

## Operations hub charts

Install: `recharts`, shadcn `chart`, `@evilcharts/pie-chart`, `@evilcharts/bar-chart`.

| Chart          | Type | Data                          |
| -------------- | ---- | ----------------------------- |
| Tournament mix | Pie  | `stats.kpis.byStatus`         |
| Largest events | Bar  | Top 8 by `tournamentAthletes` |

Placement: after KPI strip, before needs-attention. Wrapped in `HubChartPanel`.

## Out of scope

- Time-series API
- Server lifecycle rule changes
- Command center charts
- Rewriting pipeline / recent table / needs-attention

## Verification

- `bun run test`, `lint`, `build`
- Manual: empty states, draft/active/completed, light/dark mode on charts
