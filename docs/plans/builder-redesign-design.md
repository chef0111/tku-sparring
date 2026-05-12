---
name: builder-redesign-design
date: 2026-05-12
status: design
overview: Redesign the tournament Builder workspace (/dashboard/tournaments/$id/builder). Restructures the builder feature folder to the list/athlete pattern, replaces the left Sidebar with a horizontal bottom toolbar, rebuilds the Groups tab as a three-column workspace (athlete pool · group roster table · groups rail), and moves all tournament-athlete data fetching to server-side pagination/filtering/sorting.
---

# Tournament Builder Redesign

## Context

- Predecessor plan: [docs/plans/admin-crm-redesign-and-features.md](admin-crm-redesign-and-features.md) — Phases A–C done; Phase D (Groups tab) is functional but MVP-quality.
- Handoff: `c:\Users\Admin\AppData\Local\Temp\handoff-dc9638.md` — lists the UX/quality gaps to address.
- Prior-art structure: [src/features/dashboard/athlete/](../../src/features/dashboard/athlete/) and [src/features/dashboard/tournament/list/](../../src/features/dashboard/tournament/list/).
- Prior-art server-side query: [src/orpc/athlete-profiles/athlete-profiles.dal.ts](../../src/orpc/athlete-profiles/athlete-profiles.dal.ts), [src/queries/athlete-profiles.ts](../../src/queries/athlete-profiles.ts).

## Locked-in decisions

| #   | Decision                                                                                                | Rationale                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | Hybrid aesthetic: Supabase-style chrome + workspace-style layout primitives                             | Consistent with redesigned list/athlete pages but appropriate for an operational tool.                      |
| 2   | Replace left Sidebar with horizontal bottom toolbar                                                     | Preserves horizontal density for the new center DataTable; bottom bar = operational chrome.                 |
| 3   | Groups tab = master-detail with right rail                                                              | Pool on left, selected group's roster table in center, group switcher rail on right. Scales to many groups. |
| 4   | Assignment = both click `+` (primary) and drag-and-drop (power user)                                    | One-click for everyday flow; DnD for power-user batch moves.                                                |
| 5   | Rail row = name + count + status dot only; Settings button on active row                                | Clean rail visual; details surface in the center workspace.                                                 |
| 6   | Brackets tab is OUT OF SCOPE this round                                                                 | Keep existing pill-bar group selector and folder shape.                                                     |
| 7   | Bottom toolbar quick actions: Lifecycle, Refresh, Auto-assign all, Lease summary (+ Edit, Delete, Back) | Day-of operational actions surfaced; chrome actions on the right.                                           |
| 8   | Tables fetch server-side (pagination + filtering + sorting)                                             | Mirrors athlete-profiles pattern. Required for scale and for parity with the redesigned list pages.         |

## Scope

In scope:

- Folder restructure of `src/features/dashboard/tournament/builder/`.
- New layout shell: top header + center workspace + bottom toolbar (no sidebar).
- Full rewrite of the Groups tab body (pool + roster table + rail).
- New `useBuilderManagerQuery` URL-state hook.
- Server-side rewrite of `tournamentAthlete.list` (oRPC schema + DAL + client hooks).
- Bottom-toolbar quick actions: Refresh, Auto-assign all (+ dialog), Lifecycle button (reusing existing `tournament.setStatus`), Lease summary popover.
- Dialog file split: `add-group`, `edit-tournament`, `delete-tournament`, `group-settings-sheet`, plus new `auto-assign-all-dialog` and `lifecycle-confirm-dialog`.

Out of scope (deferred, may show up as follow-up tasks):

- Brackets tab visual changes (zoom/pan, connector colors, animations, score `bestOf` rethink, dark-mode SVG audit).
- Activity log toggle on the bottom toolbar (Phase G not yet shipped).
- Command palette / keyboard shortcut cheatsheet.
- Advanced filter flag (`filterFlag === 'advancedFilters'`) on the builder. Legacy where-clause only.
- Bulk row selection on the roster table.

## Folder structure (final)

```
src/features/dashboard/tournament/builder/
├── index.tsx                                     # slim orchestrator
├── hooks/
│   └── use-builder-manager-query.ts              # URL state: tab, selectedGroupId, pool filters
├── components/
│   ├── builder-shell/
│   │   ├── index.tsx                             # three-column workspace shell + read-only banner
│   │   ├── builder-header.tsx                    # top header (replaces builder/header.tsx)
│   │   └── builder-bottom-toolbar.tsx            # horizontal bottom toolbar (replaces builder/sidebar.tsx)
│   ├── groups-tab/
│   │   ├── index.tsx                             # composes pool + roster + rail + DndContext
│   │   ├── athlete-pool/
│   │   │   ├── index.tsx
│   │   │   └── athlete-pool-row.tsx              # draggable; "+" button to assign-to-selected
│   │   ├── group-roster-table/
│   │   │   ├── index.tsx                         # uses useDataTable + DataTable; server-side
│   │   │   ├── group-roster-columns.tsx
│   │   │   └── group-roster-empty-state.tsx
│   │   ├── groups-rail/
│   │   │   ├── index.tsx                         # + Add Group button + rail rows
│   │   │   └── group-rail-row.tsx                # useDroppable; active row reveals Settings
│   │   └── out-of-range-badge.tsx                # moved from groups/
│   └── dialogs/
│       ├── add-group-dialog.tsx                  # split from builder/dialogs.tsx
│       ├── edit-tournament-dialog.tsx            # split from builder/dialogs.tsx
│       ├── delete-tournament-dialog.tsx          # split from builder/dialogs.tsx
│       ├── group-settings-sheet.tsx             # moved from groups/
│       ├── auto-assign-all-dialog.tsx            # new
│       └── lifecycle-confirm-dialog.tsx          # new (reused for Activate + Complete)
└── brackets/                                     # UNCHANGED this round
    ├── brackets-tab.tsx
    ├── bracket-canvas.tsx
    └── match-detail-panel.tsx
```

Files deleted:

- `src/features/dashboard/tournament/builder/sidebar.tsx`
- `src/features/dashboard/tournament/builder/header.tsx`
- `src/features/dashboard/tournament/builder/canvas.tsx` (dead — not imported anywhere)
- `src/features/dashboard/tournament/builder/dialogs.tsx` (split per dialog)
- `src/features/dashboard/tournament/builder/groups/groups-tab.tsx`
- `src/features/dashboard/tournament/builder/groups/athlete-pool.tsx`
- `src/features/dashboard/tournament/builder/groups/group-panel.tsx` (replaced by rail + roster table)

## Section 1 — Layout shell

### Top header (`components/builder-shell/builder-header.tsx`)

Composition unchanged conceptually; structural cleanup:

- Drop `SidebarTrigger`.
- Drop `SidebarProvider` wrap at the page level (moved into shell).
- Keep: small logo + tournament name + `Builder` badge + `TournamentStatusPill` + centered `Tabs` (Groups | Brackets) + `UserDropdown`.

Sticky `top-0`, `h-14`, `border-b`, `bg-sidebar/70 supports-backdrop-filter:bg-sidebar/50`.

### Workspace shell (`components/builder-shell/index.tsx`)

```tsx
export function BuilderShell({ header, children, footer, readOnly }: Props) {
  return (
    <div className="flex h-dvh flex-col">
      {header}
      {readOnly && (
        <Alert className="mx-4 mt-3">
          <AlertTitle>Read-only workspace</AlertTitle>
          <AlertDescription>
            This tournament is completed. Builder mutations are disabled so
            results stay locked.
          </AlertDescription>
        </Alert>
      )}
      <main className="relative flex flex-1 overflow-hidden">{children}</main>
      {footer}
    </div>
  );
}
```

The shell is layout-agnostic: it owns chrome (header, bottom toolbar, read-only banner) and renders `children` inside `main`. The tab body chooses its own internal layout.

- `groups-tab/index.tsx` → three-column flex:
  - Left column: `w-72 shrink-0 border-r` (pool).
  - Center column: `flex-1 min-w-0` (DataTable).
  - Right column: `w-56 shrink-0 border-l` (rail).
- `brackets/brackets-tab.tsx` → unchanged (its own top pill-bar + canvas layout).

### Bottom toolbar (`components/builder-shell/builder-bottom-toolbar.tsx`)

`h-12`, `border-t`, `bg-sidebar/70 supports-backdrop-filter:bg-sidebar/50`, `px-4`. Three clusters with dividers:

```
[Lease 3/5 by you ▾]  │  ↻ Refresh   ⚡ Auto-assign all   ▶ Activate / ✓ Complete   │   ⚙ Edit   🗑 Delete   ← Back
```

Cluster details:

1. **Lease summary** (left): Popover trigger. Trigger label `{leasedByMe}/{totalGroups} locked by you`. Popover body = list of group rows: name · status dot · holder (admin name or "available"). Disabled if `leases` is empty (no groups yet).
2. **Quick actions** (center):
   - `Refresh` — invalidates `['tournament']`, `['group']`, `['lease']`, `['tournamentAthlete']`. Spinner during refetch.
   - `Auto-assign all` — opens `auto-assign-all-dialog`. Iterates groups (skipping groups with `_count.matches > 0`), calls `useAutoAssignGroup` per group, shows aggregated toast.
   - `Lifecycle` — hidden when `status === 'completed'`. When `status === 'draft'`: label `Activate`, opens `lifecycle-confirm-dialog` w/ target=`active`. When `status === 'active'`: label `Complete tournament`, disabled until readiness derived from existing logic in viewer header, opens dialog w/ target=`completed`. Uses existing `tournament.setStatus` oRPC (Phase C, already shipped).
3. **Chrome** (right): `Edit Tournament` (ghost), `Delete` (ghost destructive, opens existing confirm dialog), `Back to Detail` (outline + ArrowLeft, `asChild` Link to `/dashboard/tournaments/$id`).

Read-only behavior: Edit, Delete, Auto-assign all, Lifecycle disabled with tooltip "Tournament completed". Refresh + Lease summary + Back stay enabled.

## Section 2 — Groups tab internals

### Composition (`components/groups-tab/index.tsx`)

```tsx
export function GroupsTab({ tournamentId, groups, readOnly }: Props) {
  const { selectedGroupId } = useBuilderManagerQuery();
  const [, setUrl] = useQueryStates({ group: { parse: v => v, serialize: v => v ?? '' } });
  const deviceId = useDeviceId();
  const { data: leases } = useLeases(tournamentId, deviceId);
  const leaseMap = useMemo(() => new Map(leases?.map(l => [l.groupId, l])), [leases]);

  // auto-select first group when none selected
  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      void setUrl({ group: groups[0]!.id });
    }
  }, [selectedGroupId, groups, setUrl]);

  const selectedGroup = groups.find(g => g.id === selectedGroupId) ?? null;
  const assignAthlete = useAssignAthlete();

  function handleDragEnd(e: DragEndEvent) {
    const athleteId = e.active.data.current?.athleteId as string | undefined;
    const targetGroupId = e.over?.data.current?.groupId as string | undefined;
    if (!athleteId || !targetGroupId) return;
    if (e.active.data.current?.fromGroupId === targetGroupId) return;
    assignAthlete.mutate({ groupId: targetGroupId, tournamentAthleteId: athleteId });
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <AthletePool tournamentId selectedGroupId={selectedGroupId} readOnly={readOnly} />
      <GroupRosterTable
        group={selectedGroup}
        tournamentId={tournamentId}
        readOnly={readOnly}
        leaseInfo={selectedGroupId ? leaseMap.get(selectedGroupId) : undefined}
        onOpenSettings={...}
        onRequestTakeover={...}
      />
      <GroupsRail
        groups={groups}
        selectedGroupId={selectedGroupId}
        leaseMap={leaseMap}
        readOnly={readOnly}
        onSelect={(id) => setUrl({ group: id })}
        onAdd={() => setShowAddGroup(true)}
        onOpenSettings={...}
      />
      <GroupSettingsSheet ... />
      <AddGroupDialog ... />
    </DndContext>
  );
}
```

### AthletePool (`components/groups-tab/athlete-pool/`)

Visual:

```
┌──────────────────────────┐
│ Unassigned Athletes  36  │
│ [🔍 search...]           │
│ [Gender ▾] [Belt ▾] [kg▾]│
├──────────────────────────┤
│ ◫ Phong Do          M    │
│   Belt 4 · 65kg      [+] │
├──────────────────────────┤
│ ...                      │
└──────────────────────────┘
```

`index.tsx`:

- Header row: title + total count badge (`= total` from infinite query first page).
- Filter row: search input (lucide Search), gender Select, BeltRange Popover (min + max numeric inputs), WeightRange Popover (min + max numeric inputs). All bound to URL state.
- Body: virtualized list (or plain `divide-y` for now — virtualization is a follow-up). Each item is `<AthletePoolRow>`.
- Footer: infinite-scroll sentinel; when in view, `fetchNextPage()`.
- Empty: `UserPlus` icon + "No unassigned athletes" or "No matches" depending on whether filters are active.

`athlete-pool-row.tsx`:

- `useDraggable({ id: athlete.id, data: { type: 'pool-athlete', athleteId: athlete.id } })`.
- Whole row is the drag handle (`cursor-grab`, `active:cursor-grabbing`).
- Right side: `+` button (icon-only) — visible on hover and on focus. `disabled={!selectedGroupId || readOnly}`. Tooltip when disabled: "Select a group first".
- onClick `+` → `assignAthlete.mutate({ groupId: selectedGroupId, tournamentAthleteId: athlete.id })`.

### GroupRosterTable (`components/groups-tab/group-roster-table/`)

`index.tsx`:

- Header strip above table:

  ```
  Group A · Belt 7–9 · 50–60kg · M     [● Online · You]  [Take over]  [⚙ Settings]
  4 athletes · 0 violations · Arena 2
  ```

  - Constraint badges from `group.gender/beltMin/beltMax/weightMin/weightMax`.
  - `Status` pill (existing component) for lease status.
  - `Take over` button visible when `leaseInfo?.leaseStatus === 'held_by_other'`.
  - `Settings` opens `GroupSettingsSheet`.
  - Second line: counts.

- Uses `useDataTable` w/ controlled state from local `useState` for `pagination` and `sorting` (kept ephemeral — not in URL; resets on group switch).
- Calls `useTournamentAthletes({ tournamentId, groupId: group.id, page, perPage, sorting })`.
- Renders `DataTable` + `DataTableToolbar` + `DataTableSortList`. No row selection. No view options.
- Center column is also a drop target via `useDroppable({ id: 'roster:'+group.id, data: { groupId: group.id } })` wrapping the table region.

`group-roster-columns.tsx`:

| id           | header                | cell                                                                                        | sortable |
| ------------ | --------------------- | ------------------------------------------------------------------------------------------- | -------- |
| `name`       | Name                  | two-line `<p>{name}</p><p className="text-muted-foreground text-xs">{affiliation}</p>`      | yes      |
| `gender`     | M/F                   | `<Badge variant="outline">{gender}</Badge>`                                                 | yes      |
| `beltLevel`  | Belt                  | tabular-num                                                                                 | yes      |
| `weight`     | Weight                | `{n}kg` tabular-num                                                                         | yes      |
| `violations` | ⚠                     | `<OutOfRangeBadge violations={getViolations(athlete, group)} />` (popover lists violations) | no       |
| `actions`    | (empty, right-pinned) | kebab: Unassign, Move to... → submenu listing other groups                                  | no       |

Roster row is draggable too: `useDraggable({ id: athlete.id, data: { type: 'roster-athlete', athleteId, fromGroupId } })`.

`group-roster-empty-state.tsx`:

- `selectedGroup === null` → "Select a group on the right rail to view its roster." + small arrow.
- `selectedGroup && total === 0` → `UserPlus` icon + "No athletes assigned" + `Auto-assign` primary button + "Drag from the pool or click + on a pool row."
- Read-only override → "This group has no athletes."

### GroupsRail (`components/groups-tab/groups-rail/`)

`index.tsx`:

- Top: full-width `+ Add Group` button (`w-full justify-start` or centered — final styling per implementer). Hidden when `readOnly`.
- Below: `divide-y` list of `<GroupRailRow>` items. Scrolls when overflowing.
- Empty (no groups): inline message "No groups yet. Click + Add Group above."

`group-rail-row.tsx`:

- `useDroppable({ id: group.id, data: { groupId: group.id } })`.
- Click selects the group (`onSelect(group.id)`).
- Layout: `[lease dot] {name}   {count}` on one line. Active row gets `border-l-2 border-primary bg-muted/50`.
- Lease dot color from `leaseToStatusVariant(leaseInfo?.leaseStatus)`.
- Active row only: small ghost `Settings` button on the right of the row (icon-only, `size-6`). Hidden when read-only.
- Long names truncate. Tooltip on hover shows full name + constraint summary.
- Drop highlight: `bg-primary/10` when `isOver`.

### DnD wiring

Single `DndContext` lives in `groups-tab/index.tsx`. Sources:

- Pool rows → `data.type: 'pool-athlete'`.
- Roster rows → `data.type: 'roster-athlete'`, includes `fromGroupId`.

Drop targets:

- Each rail row (`data.groupId`).
- Center roster table region (`data.groupId` = currently selected group).

Mutation: `useAssignAthlete().mutate({ groupId, tournamentAthleteId })`. Invalidation already in place. Cross-group moves use the same mutation (server transitions `groupId` directly).

## Section 3 — URL state hook

`hooks/use-builder-manager-query.ts`:

```ts
const POOL_GENDER = parseAsStringEnum(['M', 'F']);

export function useBuilderManagerQuery() {
  const [tab] = useQueryState(
    'tab',
    parseAsStringEnum(['groups', 'brackets']).withDefault('groups')
  );
  const [selectedGroupId] = useQueryState('group');
  const [poolQuery] = useQueryState('q');
  const [poolGender] = useQueryState('poolGender', POOL_GENDER);
  const [poolBeltMin] = useQueryState('poolBeltMin', parseAsInteger);
  const [poolBeltMax] = useQueryState('poolBeltMax', parseAsInteger);
  const [poolWeightMin] = useQueryState('poolWeightMin', parseAsInteger);
  const [poolWeightMax] = useQueryState('poolWeightMax', parseAsInteger);
  return {
    tab,
    selectedGroupId,
    poolQuery,
    poolGender,
    poolBeltMin,
    poolBeltMax,
    poolWeightMin,
    poolWeightMax,
  };
}
```

Setters via separate `useQueryStates` calls in components that mutate (toolbar tab switch, rail row click, pool filters). Following the same separation used in `list/index.tsx`.

Tab switching in the top header writes `tab` URL param. Default `groups`.

## Section 4 — Server-side data fetching

### oRPC schema (`src/orpc/tournament-athletes/tournament-athletes.dto.ts`)

Replace `ListTournamentAthletesSchema` with:

```ts
export const ListTournamentAthletesSchema = z.object({
  tournamentId: z.string(),
  // selector
  groupId: z.string().optional(),
  unassignedOnly: z.boolean().optional().default(false),
  // pagination
  page: z.number().int().min(1).optional().default(1),
  perPage: z.number().int().min(1).max(200).optional().default(30),
  // filters
  query: z.string().optional(),
  gender: z
    .array(z.enum(['M', 'F']))
    .min(1)
    .max(2)
    .optional(),
  beltLevels: z
    .array(z.number().int().min(0).max(10))
    .min(1)
    .max(20)
    .optional(),
  beltLevelMin: z.number().int().min(0).max(10).optional(),
  beltLevelMax: z.number().int().min(0).max(10).optional(),
  weightMin: z.number().min(0).optional(),
  weightMax: z.number().max(300).optional(),
  status: z.enum(['selected', 'assigned', 'eliminated']).optional(),
  // sort
  sorting: z
    .array(
      z.object({
        id: z.enum(['name', 'gender', 'beltLevel', 'weight', 'createdAt']),
        desc: z.boolean(),
      })
    )
    .max(5)
    .optional()
    .default([]),
});
```

Output type: `{ items: TournamentAthleteData[], total: number }`.

### DAL (`tournament-athletes.dal.ts`)

Replace `findByTournamentId` body with:

```ts
export async function findByTournamentId(input: ListTournamentAthletesDTO) {
  const {
    tournamentId,
    groupId,
    unassignedOnly,
    status,
    page,
    perPage,
    query,
    gender,
    beltLevels,
    beltLevelMin,
    beltLevelMax,
    weightMin,
    weightMax,
    sorting,
  } = input;

  const where = {
    tournamentId,
    ...(unassignedOnly ? { groupId: null } : groupId ? { groupId } : {}),
    ...(status ? { status } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { affiliation: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(gender && gender.length > 0 ? { gender: { in: gender } } : {}),
    ...(beltLevels && beltLevels.length > 0
      ? { beltLevel: { in: beltLevels } }
      : beltLevelMin !== undefined || beltLevelMax !== undefined
        ? {
            beltLevel: {
              ...(beltLevelMin !== undefined ? { gte: beltLevelMin } : {}),
              ...(beltLevelMax !== undefined ? { lte: beltLevelMax } : {}),
            },
          }
        : {}),
    ...(weightMin !== undefined || weightMax !== undefined
      ? {
          weight: {
            ...(weightMin !== undefined ? { gte: weightMin } : {}),
            ...(weightMax !== undefined ? { lte: weightMax } : {}),
          },
        }
      : {}),
  };

  const orderBy =
    sorting.length > 0
      ? sorting.map((s) => ({
          [s.id]: s.desc ? ('desc' as const) : ('asc' as const),
        }))
      : [{ createdAt: 'asc' as const }];

  const [items, total] = await Promise.all([
    prisma.tournamentAthlete.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      include: { athleteProfile: { select: { id: true, athleteCode: true } } },
    }),
    prisma.tournamentAthlete.count({ where }),
  ]);

  return { items, total };
}
```

### Client hooks (`src/queries/tournament-athletes.ts`)

Update `useTournamentAthletes` to keep its signature but expect `{ items, total }`. Add `useTournamentAthletesInfinite`:

```ts
export function useTournamentAthletes(input: ListTournamentAthletesDTO) {
  return useQuery({
    queryKey: ['tournamentAthlete', 'list', input] as const,
    queryFn: () => client.tournamentAthlete.list(input),
    placeholderData: keepPreviousData,
  });
}

export function useTournamentAthletesInfinite(
  input: Omit<ListTournamentAthletesDTO, 'page'>
) {
  return useInfiniteQuery({
    queryKey: ['tournamentAthlete', 'list', 'infinite', input] as const,
    queryFn: ({ pageParam }: { pageParam: number }) =>
      client.tournamentAthlete.list({ ...input, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last, allPages) => {
      const fetched = allPages.reduce((acc, p) => acc + p.items.length, 0);
      return fetched < last.total ? allPages.length + 1 : undefined;
    },
    placeholderData: keepPreviousData,
  });
}
```

### Callsite migrations

- `groups/group-panel.tsx` — file deleted. Replaced by `group-roster-table/index.tsx` using new shape.
- `groups/athlete-pool.tsx` — file deleted. Replaced by `athlete-pool/index.tsx` using `useTournamentAthletesInfinite`.
- `brackets/brackets-tab.tsx` — change `athletesQuery.data ?? []` → `athletesQuery.data?.items ?? []`. One-line fix.
- DAL test `__tests__/tournament-athletes.dal.test.ts` — update assertions to expect `{ items, total }` shape and exercise the new filter/sort/paging paths.

## Section 5 — Dialogs

Split `builder/dialogs.tsx` into per-dialog files under `components/dialogs/`:

- `add-group-dialog.tsx` — owned by groups-tab; opened by `+ Add Group` rail button.
- `edit-tournament-dialog.tsx` — owned by builder root; opened by bottom toolbar Edit.
- `delete-tournament-dialog.tsx` — owned by builder root; opened by bottom toolbar Delete.
- `group-settings-sheet.tsx` — moved from `groups/`; owned by groups-tab.
- `auto-assign-all-dialog.tsx` — **new**:
  - Lists groups, splitting into "Will run" (no matches yet) and "Skipped" (has matches).
  - "Run" button triggers `useAutoAssignGroup` per eligible group sequentially (or `Promise.all` — sequential is safer for write conflicts; final call: sequential).
  - On completion, aggregated toast: `Auto-assigned {N} athletes across {M} groups (skipped {K})`.
- `lifecycle-confirm-dialog.tsx` — **new**, generic confirm:
  - Props: `{ target: 'active' | 'completed', open, onOpenChange, tournamentId, tournamentName }`.
  - Copy varies by target. Calls existing `useSetTournamentStatus` (or equivalent already shipped in Phase C).

Existing `useDeleteTournament` already navigates away on success — keep behavior in builder context (going back to `/dashboard/tournaments` is appropriate when the tournament you're building gets deleted).

## Verification checklist

1. `bun run lint` clean.
2. `bun run typecheck` clean.
3. DAL test for `tournamentAthlete.list` exercises:
   - `unassignedOnly: true` → only `groupId: null` rows.
   - `groupId: 'X'` → only `groupId === 'X'` rows.
   - `query` → name OR affiliation insensitive.
   - `gender: ['M']`, `beltLevelMin/Max`, `weightMin/Max` work in combination.
   - `sorting` honored.
   - `page/perPage` produce correct `total` + sliced `items`.
4. Manual smoke (Groups tab):
   - Create 2 groups; switch via rail; roster table reflects.
   - Pool filters (search, gender, belt range, weight range) update URL and refetch.
   - Pool infinite scroll: scroll past page 1, more rows load.
   - Click `+` on pool row with no group selected → tooltip shown, disabled.
   - Click `+` on pool row with group selected → athlete moves to roster table.
   - Drag pool row onto a rail row of a different group → athlete moves there.
   - Drag a roster row onto a different rail row → moves between groups.
   - Roster table: sort by name/belt/weight, paginate.
   - Out-of-range badge shows on rows violating group constraints; popover lists violations.
5. Manual smoke (bottom toolbar):
   - Refresh button shows spinner and re-fetches.
   - Auto-assign all: dialog lists eligible + skipped groups; running assigns athletes and toasts a summary.
   - Lifecycle: button label changes with status; confirm dialog opens; status updates.
   - Lease popover lists groups with holders.
   - Edit, Delete, Back behave as before.
6. Manual smoke (Brackets tab): still works; one-line callsite update verified.
7. URL share: copy URL with `?tab=groups&group=<id>&q=phong` → opens same selection on a fresh tab.

## Risks and mitigations

- **Shape change to `tournamentAthlete.list`**: breaks any caller that reads `data` as `Array<...>`. Mitigation: `Grep` all callers as the first implementation step; only known callsite outside the deleted files is `brackets-tab.tsx`. Update DAL test simultaneously.
- **Infinite query + filter changes**: `keepPreviousData` + filter change can show stale pages briefly. Mitigation: reset to page 1 by changing the queryKey when filters change (default `useInfiniteQuery` behavior — query key includes the input).
- **DnD with infinite list**: when athlete is reassigned, the infinite query invalidates and refetches from page 1 — visible jump. Mitigation: acceptable for now; flagged as follow-up if it becomes noisy.
- **Read-only correctness**: Disable mutation triggers (`+` button, drag handles, kebab actions, settings, bottom-toolbar mutating buttons) when `readOnly`. Single source of truth: `useTournamentReadOnly(tournamentId)`.

## Follow-ups (not in this round)

- Brackets tab visual polish (handoff items).
- Activity log toggle on bottom toolbar (waits on Phase G).
- Virtualized pool list when list grows past a few hundred items.
- Command palette and keyboard shortcuts on the builder.
- Advanced filter flag on tournament-athlete list (filter columns + filter map mirroring `athleteProfileFilterMap`).
