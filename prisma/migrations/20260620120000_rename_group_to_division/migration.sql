-- RenameTable
ALTER TABLE "group" RENAME TO "division";

-- RenameColumn
ALTER TABLE "match" RENAME COLUMN "groupId" TO "divisionId";
ALTER TABLE "tournament_athlete" RENAME COLUMN "groupId" TO "divisionId";
ALTER TABLE "arena_match_claim" RENAME COLUMN "groupId" TO "divisionId";
ALTER TABLE "device_last_selection" RENAME COLUMN "groupId" TO "divisionId";
ALTER TABLE "tournament" RENAME COLUMN "arenaGroupOrder" TO "arenaDivisionOrder";

-- RenameIndex
ALTER INDEX "group_tournamentId_idx" RENAME TO "division_tournamentId_idx";
ALTER INDEX "match_groupId_idx" RENAME TO "match_divisionId_idx";
ALTER INDEX "tournament_athlete_groupId_idx" RENAME TO "tournament_athlete_divisionId_idx";
ALTER INDEX "arena_match_claim_groupId_idx" RENAME TO "arena_match_claim_divisionId_idx";

-- RenameForeignKey
ALTER TABLE "division" RENAME CONSTRAINT "group_tournamentId_fkey" TO "division_tournamentId_fkey";
ALTER TABLE "match" RENAME CONSTRAINT "match_groupId_fkey" TO "match_divisionId_fkey";
ALTER TABLE "tournament_athlete" RENAME CONSTRAINT "tournament_athlete_groupId_fkey" TO "tournament_athlete_divisionId_fkey";

-- Backfill activity audit vocabulary
UPDATE "tournament_activity"
SET "eventType" = REPLACE("eventType", 'group.', 'division.')
WHERE "eventType" LIKE 'group.%';

UPDATE "tournament_activity"
SET "entityType" = 'division'
WHERE "entityType" = 'group';
