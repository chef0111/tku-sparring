## Problem Statement

The admin athlete registry table became unreliable once URL-synced filters, sorting, column visibility, and row selection were combined with server-side data fetching. From an admin's perspective, the table felt broken: filters updated the URL but not the visible rows, sorting required a refresh to take effect, column visibility controls updated partially or inconsistently, reset behavior did not always clear the rendered UI, and row selection could error or become stuck. The core problem was not a single broken control, but an inconsistent state architecture across the table, URL query params, server query inputs, and rendered UI.

## Solution

The athlete registry table should use a single controlled state model for all interactive table concerns: pagination, sorting, filters, column visibility, and row selection. That controlled state should be the only source of truth for both the rendered UI and the server query inputs. The table renderer, toolbar, pagination controls, filter controls, and column visibility menu should all react to the same controlled state rather than reading a mix of stale table instances, local component state, and duplicated query-param hooks. The resulting experience should be predictable: when an admin filters, sorts, resets, hides a column, or selects rows, the URL, query inputs, visible rows, and visible headers should all update together without refreshes.

## User Stories

1. As an admin, I want typing into a text filter to update the visible athlete rows immediately, so that I can narrow the list without refreshing the page.
2. As an admin, I want the filter inputs to stay in sync with the URL, so that I can share or revisit the current table state.
3. As an admin, I want clearing a filter to update the input, URL, and visible rows together, so that reset behavior feels trustworthy.
4. As an admin, I want the Reset button to appear whenever any table filter is active, so that I can return to the default view quickly.
5. As an admin, I want the Reset button to disappear once all filters are cleared, so that the toolbar reflects the actual current table state.
6. As an admin, I want a text filter containing spaces to be treated as the exact typed search string, so that searching for full athlete names does not silently split into different semantics.
7. As an admin, I want faceted filters such as gender to update both the URL and the displayed rows, so that categorical filters behave consistently with text filters.
8. As an admin, I want range filters such as belt level and weight to update the displayed rows immediately, so that numeric filtering is usable during roster management.
9. As an admin, I want sorting controls to change the visible row order without refreshes, so that I can inspect the registry from different angles quickly.
10. As an admin, I want sorting state to stay in sync with the URL, so that returning to a bookmarked table preserves my chosen sort order.
11. As an admin, I want hiding a column to remove both the header and body cells for that column, so that the table layout stays aligned.
12. As an admin, I want showing a hidden column to restore both its header and its body cells in the correct position, so that column visibility feels reversible and safe.
13. As an admin, I want the View dropdown checkmarks to reflect the actual visible columns, so that I can trust the menu state.
14. As an admin, I want column visibility changes made from either the View dropdown or a header action to update the same shared state, so that multiple visibility controls do not drift apart.
15. As an admin, I want row selection to persist safely while I interact with the current page, so that I can bulk-add athletes to tournaments without fighting the UI.
16. As an admin, I want row selection to clear or reconcile safely when the current server data changes, so that the app never throws selection errors against missing rows.
17. As an admin, I want multi-select and deselect actions to work repeatedly on the same page, so that bulk actions remain reliable.
18. As an admin, I want pagination controls to reflect the current page and page size accurately, so that server-side pagination is understandable.
19. As an admin, I want loading transitions to preserve previous visible data while a new server result is fetching, so that the table does not flash or collapse unnecessarily.
20. As an admin, I want an empty-result state to appear only when the current query truly has no results, so that I can distinguish between loading, broken rendering, and a real empty search.
21. As an admin, I want the athlete registry page to derive server query inputs from the same table state used for rendering, so that the UI never shows controls that disagree with the data request.
22. As an admin, I want filter, sort, and visibility regressions to be prevented by tests around observable behavior, so that future refactors do not silently break the table again.
23. As a developer, I want one table-state owner instead of duplicated URL and UI state managers, so that debugging and extending the athlete table becomes simpler.
24. As a developer, I want the reusable data-table primitives to support controlled server-side behavior, so that future admin pages can reuse the same pattern safely.
25. As a developer, I want the query layer to use stable query keys that reflect current filter and sort inputs, so that TanStack Query refetches when visible state actually changes.

## Implementation Decisions

- The athlete registry table uses one controlled state owner for pagination, sorting, column filters, column visibility, and row selection.
- URL query params are still supported, but they are derived and managed through the table state owner rather than being duplicated in both the page and the table primitives.
- Server query inputs for the athlete list are derived from controlled table state, not from a second parallel query-param state path.
- The reusable table hook exposes its controlled state explicitly so consuming components can render from React props instead of assuming the table instance itself is reactive.
- Table subcomponents that need to reflect interaction state, including the toolbar, pagination UI, filter controls, and view options, consume the controlled state directly.
- Column visibility is treated as controlled UI state. Header rendering and body-cell rendering must both respect the same visibility map.
- Hidden columns are removed from the rendered header row and the rendered body cells using the same source of truth.
- Text filters preserve exact typed strings, including spaces, instead of automatically splitting on non-alphanumeric characters.
- Different filter variants keep their natural shapes: text as strings, faceted filters as arrays, and range filters as paired numeric values.
- Row selection uses stable row identifiers from persisted athlete IDs rather than transient row indexes.
- When the current server page changes, stale row-selection entries that no longer exist in the current data set are reconciled or cleared safely.
- Server-side table mode remains enabled for filtering, sorting, and pagination.
- The athlete list query uses a query key that includes the current list input so visible table state changes trigger the correct fetch behavior.
- Query placeholder data is retained during refetches to avoid unnecessary table flashes while still allowing the incoming result to replace the rendered rows once available.
- The athlete page remains responsible for athlete-specific query input mapping, while the data-table layer remains responsible for controlled interaction state and reusable render behavior.
- The data-table system should support multiple interaction entry points for the same concern, such as header-menu hide and View-dropdown hide, while routing both to the same state slice.
- Debugging and future maintenance should prefer isolating state boundaries: URL state, controlled table state, query input derivation, server results, and rendered rows/headers.

## Testing Decisions

- Good tests should validate external behavior only: what rows are rendered, whether a column disappears, whether the reset button appears, whether row selection remains stable, and whether the correct query input is produced. Tests should avoid asserting internal implementation details like hook-local temporary variables.
- The primary module to test is the controlled data-table state hook, especially synchronization between URL state, controlled state, and consumer-facing state outputs.
- The reusable table renderer should be tested for visible-header and visible-cell alignment when column visibility changes.
- Toolbar and filter controls should be tested for exact text filtering, reset behavior, and appearance/disappearance of active-filter affordances.
- View-options behavior should be tested to confirm checkmarks, visibility state, and rendered headers/body cells stay aligned.
- Row-selection behavior should be tested against stable IDs and data changes to ensure selection is safe across refetches.
- Athlete list query behavior should be tested to confirm filter and sort changes produce distinct query inputs and cause the displayed data to update.
- Integration coverage should focus on the athlete registry page because the regression emerged from the interaction between reusable data-table primitives and athlete-specific server queries.
- Prior art for behavior-focused testing already exists in the codebase's validation, DAL, and athlete-related integration work, which favors asserting contract behavior over implementation mechanics.
- Future tests should prioritize scenarios that previously failed in practice: text filters with spaces, reset after matching results, sorting without refresh, hiding columns from multiple entry points, and selecting rows after refetches.

## Out of Scope

- New athlete registry features unrelated to state consistency, such as new columns, new bulk actions, or new search semantics.
- Broader redesign of the shared design system or all data-table components across the application.
- Fuzzy athlete-name search, ranking improvements, or search relevance tuning.
- Changes to athlete-profile domain rules, duplicate-detection logic, or tournament bulk-add business rules.
- Non-athlete admin pages unless they explicitly adopt the same controlled-state architecture later.
- Performance tuning beyond what is required to keep the table stable and correctly reactive.

## Further Notes

- This PRD is intended as a future-proofing record for a bugfix cluster, not as a brand-new feature proposal.
- The core lesson is architectural: interactive server-backed tables must not mix duplicated URL state, ad hoc local control state, and a stable table instance that consumers mistakenly treat as reactive.
- The controlled table state contract should be treated as reusable platform behavior for future admin CRM pages that use the shared data-table primitives.
- If other table pages adopt the same primitives, they should follow the same pattern from the start rather than copying page-specific query-state hooks alongside the shared table hook.
