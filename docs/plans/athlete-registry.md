---
name: Admin CRM Athletes Phase 1
overview: 'Implement the first three Admin CRM items: AthleteProfile + TournamentAthlete data model, global athlete registry CRUD with de-dup validation, and bulk add athletes to tournament.'
todos:
  - id: schema-update
    content: 'Update Prisma schema: remove Athlete, add AthleteProfile + TournamentAthlete'
    status: pending
  - id: api-athlete-profile
    content: Create athleteProfile oRPC namespace with CRUD + de-dup endpoints
    status: pending
  - id: api-tournament-athlete
    content: Create tournamentAthlete oRPC namespace with bulkAdd endpoint
    status: pending
  - id: query-hooks
    content: Create React Query hooks for athlete profiles and tournament athletes
    status: pending
  - id: ui-athletes-table
    content: Build Athletes page with data-table, filters, and bulk action bar
    status: pending
  - id: ui-dialogs
    content: Build form dialog, delete dialog, duplicate warning, and bulk add modal
    status: pending
  - id: tests
    content: Write unit tests for de-dup logic and integration test for CRUD flow
    status: pending
isProject: false
---

# Admin CRM: Athletes Phase 1 Implementation Plan

## Assumptions

- No existing athlete data in production; clean schema replacement is safe
- MongoDB/Prisma stack remains unchanged
- De-dup weight matching uses exact equality for MVP
- `beltLevel` is stored as Int (0-10) with client-side label mapping
- `TournamentAthlete` snapshot fields are copied once at add-time (frozen)
- Bulk add always creates `TournamentAthlete` records; auto-assign runs on top and reports unmatched count
- Existing data-table components (`src/components/data-table/`) are reused
- Existing oRPC patterns (authedProcedure, DAL, DTO) are followed
- Scope is strictly items 1-3 from `docs/project-todo.md`; Groups tab and Brackets tab are out of scope

---

## 1. Data Model / Schema Changes

### 1.1 Remove old Athlete model

Delete the current `Athlete` model from `prisma/schema.prisma`.

### 1.2 Add AthleteProfile model

```prisma
model AthleteProfile {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  athleteCode String?
  name        String
  gender      String   // "M" | "F"
  beltLevel   Int      // 0-10
  weight      Float    // kg, 20-150 bounds enforced at API
  affiliation String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tournamentAthletes TournamentAthlete[]

  @@index([athleteCode])
  @@index([name, affiliation, beltLevel, weight])
  @@map("athlete_profile")
}
```

### 1.3 Add TournamentAthlete model

```prisma
model TournamentAthlete {
  id               String   @id @default(auto()) @map("_id") @db.ObjectId
  tournamentId     String   @db.ObjectId
  athleteProfileId String   @db.ObjectId
  groupId          String?  @db.ObjectId
  seed             Int?
  locked           Boolean  @default(false)
  status           String   @default("selected") // selected | assigned | eliminated
  notes            String?

  // Snapshot fields (copied at add-time)
  name        String
  gender      String
  beltLevel   Int
  weight      Float
  affiliation String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tournament     Tournament     @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  athleteProfile AthleteProfile @relation(fields: [athleteProfileId], references: [id], onDelete: Cascade)
  group          Group?         @relation(fields: [groupId], references: [id], onDelete: SetNull)

  @@unique([tournamentId, athleteProfileId])
  @@index([tournamentId])
  @@index([groupId])
  @@map("tournament_athlete")
}
```

### 1.4 Update Tournament model relation

```prisma
model Tournament {
  // ... existing fields ...
  tournamentAthletes TournamentAthlete[]
  // Remove: athletes Athlete[]
}
```

### 1.5 Update Group model relation

```prisma
model Group {
  // ... existing fields ...
  tournamentAthletes TournamentAthlete[]
  // Remove: athletes Athlete[]
}
```

---

## 2. API / oRPC Changes

### 2.1 New namespace: `athleteProfile`

Location: `src/orpc/athlete-profiles/`

| Procedure                | Input                                                                                                     | Output                                                                      | Notes                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------- |
| `list`                   | `{ search?, gender?, beltLevelMin?, beltLevelMax?, weightMin?, weightMax?, affiliation?, page?, limit? }` | `{ items: AthleteProfile[], total: number }`                                | Paginated, filterable                             |
| `get`                    | `{ id }`                                                                                                  | `AthleteProfile`                                                            |                                                   |
| `create`                 | `CreateAthleteProfileDTO`                                                                                 | `AthleteProfile`                                                            | Runs de-dup check                                 |
| `createWithConfirmation` | `CreateAthleteProfileDTO & { confirmDuplicate: boolean }`                                                 | `AthleteProfile`                                                            | Bypasses soft warning if `confirmDuplicate: true` |
| `update`                 | `UpdateAthleteProfileDTO`                                                                                 | `AthleteProfile`                                                            |                                                   |
| `delete`                 | `{ id }`                                                                                                  | `void`                                                                      | Cascade deletes TournamentAthlete records         |
| `checkDuplicate`         | `{ athleteCode?, name, gender, beltLevel, weight, affiliation }`                                          | `{ isDuplicate: boolean, isHardBlock: boolean, matches: AthleteProfile[] }` | Used by UI before create                          |

### 2.2 New namespace: `tournamentAthlete`

Location: `src/orpc/tournament-athletes/`

| Procedure    | Input                                                                 | Output                                                    | Notes            |
| ------------ | --------------------------------------------------------------------- | --------------------------------------------------------- | ---------------- |
| `list`       | `{ tournamentId, groupId?, status? }`                                 | `TournamentAthlete[]`                                     |                  |
| `bulkAdd`    | `{ tournamentId, athleteProfileIds: string[], autoAssign?: boolean }` | `{ added: number, assigned: number, unassigned: number }` | Core bulk action |
| `update`     | `{ id, groupId?, status?, seed?, locked?, notes? }`                   | `TournamentAthlete`                                       |                  |
| `remove`     | `{ id }`                                                              | `void`                                                    |                  |
| `bulkRemove` | `{ ids: string[] }`                                                   | `{ removed: number }`                                     |                  |

### 2.3 Update router.ts

```typescript
// src/orpc/router.ts
import { athleteProfile } from './athlete-profiles';
import { tournamentAthlete } from './tournament-athletes';

export const router = {
  // ... existing
  athleteProfile,
  tournamentAthlete,
};
```

### 2.4 Remove old `athlete` namespace

Delete `src/orpc/athletes/` folder and remove from router.

### 2.5 DTOs

**`src/orpc/athlete-profiles/athlete-profiles.dto.ts`**

```typescript
export const CreateAthleteProfileSchema = z.object({
  athleteCode: z.string().optional(),
  name: z.string().min(1),
  gender: z.enum(['M', 'F']),
  beltLevel: z.number().int().min(0).max(10),
  weight: z.number().min(20).max(150),
  affiliation: z.string().min(1),
});

export const UpdateAthleteProfileSchema = z.object({
  id: z.string(),
  athleteCode: z.string().optional(),
  name: z.string().min(1).optional(),
  gender: z.enum(['M', 'F']).optional(),
  beltLevel: z.number().int().min(0).max(10).optional(),
  weight: z.number().min(20).max(150).optional(),
  affiliation: z.string().min(1).optional(),
});
```

**`src/orpc/tournament-athletes/tournament-athletes.dto.ts`**

```typescript
export const BulkAddAthletesSchema = z.object({
  tournamentId: z.string(),
  athleteProfileIds: z.array(z.string()).min(1),
  autoAssign: z.boolean().optional().default(false),
});

export const UpdateTournamentAthleteSchema = z.object({
  id: z.string(),
  groupId: z.string().nullable().optional(),
  status: z.enum(['selected', 'assigned', 'eliminated']).optional(),
  seed: z.number().int().nullable().optional(),
  locked: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});
```

---

## 3. UI Changes

### 3.1 Athletes Page (Global Registry)

**File:** `src/features/dashboard/athlete/index.tsx`

**Components to add:**

- `AthletesTable` — data-table with columns: select, athleteCode, name, gender, belt, weight, affiliation, actions
- `AthleteFormDialog` — create/edit form with all fields
- `DeleteAthleteDialog` — confirmation dialog
- `BulkAddAthletesDialog` — modal for bulk action
- `DuplicateWarningDialog` — shown when soft de-dup triggers

**Column definitions:** `src/features/dashboard/athlete/athletes-table-columns.tsx`

**Toolbar:** filters for gender (select), beltLevel (range), weight (range), affiliation (text), search (name/athleteCode)

**Bulk actions bar:** "Add to Tournament" button (visible when rows selected)

### 3.2 Bulk Add to Tournament Modal

**File:** `src/features/dashboard/athlete/bulk-add-to-tournament-dialog.tsx`

**UI:**

- Tournament selector (combobox with search, shows last-used first)
- Toggle: "Auto-assign by group constraints"
- Summary of selected athletes count
- Submit button

**Behavior:**

- Calls `tournamentAthlete.bulkAdd`
- Shows toast with result: "Added X athletes. Y assigned to groups, Z unassigned."

### 3.3 Query Hooks

**File:** `src/queries/athlete-profiles.ts`

```typescript
export function useAthleteProfiles(filters) { ... }
export function useAthleteProfile(id) { ... }
export function useCreateAthleteProfile() { ... }
export function useUpdateAthleteProfile() { ... }
export function useDeleteAthleteProfile() { ... }
export function useCheckDuplicate() { ... }
```

**File:** `src/queries/tournament-athletes.ts`

```typescript
export function useTournamentAthletes(tournamentId, filters) { ... }
export function useBulkAddAthletes() { ... }
export function useUpdateTournamentAthlete() { ... }
export function useRemoveTournamentAthlete() { ... }
```

### 3.4 Constants

**File:** `src/config/athlete.ts`

```typescript
export const BELT_LEVELS = [
  { value: 0, label: 'White' },
  { value: 1, label: 'Yellow' },
  // ... up to 10
] as const;

export const GENDER_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
] as const;
```

---

## 4. Validation and De-dup Logic

### 4.1 Hard Block Rule

**Condition:** `athleteCode` is provided AND another profile exists with same `athleteCode` + `name`

**Implementation:** In `athleteProfile.create` handler:

```typescript
if (input.athleteCode) {
  const existing = await findByAthleteCodeAndName(
    input.athleteCode,
    input.name
  );
  if (existing) {
    throw new Error('DUPLICATE_ATHLETE_CODE_NAME');
  }
}
```

### 4.2 Soft Warning Rule

**Condition:** `athleteCode` is NOT provided AND another profile exists with exact match on `name` + `affiliation` + `weight` + `beltLevel`

**Implementation:** `athleteProfile.checkDuplicate` returns matches; UI shows warning dialog if matches found.

```typescript
// DAL function
async function findPossibleDuplicates(input) {
  return prisma.athleteProfile.findMany({
    where: {
      name: input.name,
      affiliation: input.affiliation,
      weight: input.weight,
      beltLevel: input.beltLevel,
    },
  });
}
```

### 4.3 UI Flow

1. User fills form and clicks "Create"
2. UI calls `checkDuplicate`
3. If `isHardBlock: true` → show error, block submission
4. If `isDuplicate: true` (soft) → show `DuplicateWarningDialog` with matches list
5. User can "Cancel" or "Create Anyway"
6. "Create Anyway" calls `createWithConfirmation({ ...data, confirmDuplicate: true })`

### 4.4 Weight/Belt Bounds

- Weight: 20-150 kg (Zod validation)
- Belt: 0-10 integer (Zod validation)
- Both validated server-side; client shows inline errors

---

## 5. Tests

### 5.1 Unit Tests

**Location:** `src/orpc/athlete-profiles/__tests__/`

- `athlete-profiles.dal.test.ts`
  - findAll with filters
  - findById
  - create
  - update
  - delete cascade

- `athlete-profiles.validation.test.ts`
  - Hard block: athleteCode + name collision
  - Soft warning: exact field match detection
  - Weight bounds (reject <20, >150)
  - Belt bounds (reject <0, >10)

**Location:** `src/orpc/tournament-athletes/__tests__/`

- `tournament-athletes.dal.test.ts`
  - bulkAdd creates records with snapshots
  - bulkAdd with autoAssign (mocked group constraints)
  - unique constraint prevents double-add

### 5.2 Integration Tests

**Location:** `tests/integration/`

- `athlete-registry.test.ts`
  - Full CRUD flow via oRPC client
  - De-dup blocking and warning flows
  - Bulk add to tournament

### 5.3 Component Tests (optional for MVP)

- `AthletesTable` renders columns correctly
- `AthleteFormDialog` validates inputs
- `BulkAddAthletesDialog` calls mutation with correct payload

---

## 6. Risks and Mitigations

| Risk                                   | Impact                          | Mitigation                                                                |
| -------------------------------------- | ------------------------------- | ------------------------------------------------------------------------- |
| Schema push fails on MongoDB indexes   | Blocks deployment               | Test `prisma db push` locally first; indexes are additive                 |
| Bulk add performance with 256 athletes | Slow UX                         | Use `createMany` in Prisma; single transaction                            |
| De-dup false negatives (typos in name) | Admin creates duplicates        | MVP accepts this; fuzzy matching deferred                                 |
| Snapshot fields diverge from profile   | Confusion about source of truth | Document clearly; UI shows "tournament values" vs "profile values" labels |
| Old athlete routes still referenced    | Runtime errors                  | Search codebase for `orpc.athlete` usages; update all                     |

---

## 7. Execution Steps

### Phase A: Schema

1. **Update `prisma/schema.prisma`**
   - Remove `Athlete` model
   - Add `AthleteProfile` model
   - Add `TournamentAthlete` model
   - Update `Tournament` and `Group` relations

2. **Run `prisma db push`** to apply schema

3. **Run `prisma generate`** to regenerate client

### Phase B: API Layer

4. **Create `src/orpc/athlete-profiles/`**
   - `athlete-profiles.dto.ts` — Zod schemas
   - `athlete-profiles.dal.ts` — Prisma DAL functions
   - `index.ts` — oRPC procedures (list, get, create, createWithConfirmation, update, delete, checkDuplicate)

5. **Create `src/orpc/tournament-athletes/`**
   - `tournament-athletes.dto.ts` — Zod schemas
   - `tournament-athletes.dal.ts` — Prisma DAL functions
   - `index.ts` — oRPC procedures (list, bulkAdd, update, remove, bulkRemove)

6. **Update `src/orpc/router.ts`**
   - Import and mount `athleteProfile` and `tournamentAthlete`
   - Remove old `athlete` namespace

7. **Delete `src/orpc/athletes/`** folder

8. **Update `src/queries/athletes.ts`** → rename to `athlete-profiles.ts` with new hooks

9. **Create `src/queries/tournament-athletes.ts`** with bulk add hooks

### Phase C: UI Layer

10. **Create `src/config/athlete.ts`** — belt levels and gender constants

11. **Create `src/features/dashboard/athlete/athletes-table-columns.tsx`** — column definitions

12. **Create `src/features/dashboard/athlete/athlete-form-dialog.tsx`** — create/edit form

13. **Create `src/features/dashboard/athlete/delete-athlete-dialog.tsx`** — delete confirmation

14. **Create `src/features/dashboard/athlete/duplicate-warning-dialog.tsx`** — soft de-dup warning

15. **Create `src/features/dashboard/athlete/bulk-add-to-tournament-dialog.tsx`** — bulk action modal

16. **Update `src/features/dashboard/athlete/index.tsx`**
    - Import and render `AthletesTable` with toolbar, filters, bulk action bar
    - Wire up dialogs

### Phase D: Verification

17. **Write unit tests** for DAL and validation logic

18. **Write integration test** for full CRUD + bulk add flow

19. **Manual smoke test**
    - Create athlete with athleteCode → verify hard block on duplicate
    - Create athlete without athleteCode → verify soft warning
    - Bulk add to tournament → verify snapshot fields copied
    - Verify table filters and pagination

20. **Update `docs/project-todo.md`** — move items 1-3 to Finished
