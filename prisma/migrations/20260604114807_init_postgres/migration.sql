-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT,
    "displayUsername" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" UUID NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" UUID NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "nameSortKey" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "arenaGroupOrder" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "tournamentId" UUID NOT NULL,
    "gender" TEXT,
    "beltMin" INTEGER,
    "beltMax" INTEGER,
    "weightMin" DOUBLE PRECISION,
    "weightMax" DOUBLE PRECISION,
    "thirdPlaceMatch" BOOLEAN NOT NULL DEFAULT false,
    "arenaIndex" INTEGER NOT NULL DEFAULT 1,
    "round0Baseline" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arena_match_claim" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "deviceId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arena_match_claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match" (
    "id" UUID NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'bracket',
    "displayLabel" TEXT,
    "round" INTEGER NOT NULL DEFAULT 0,
    "matchIndex" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "redAthleteId" UUID,
    "blueAthleteId" UUID,
    "redTournamentAthleteId" UUID,
    "blueTournamentAthleteId" UUID,
    "redWins" INTEGER NOT NULL DEFAULT 0,
    "blueWins" INTEGER NOT NULL DEFAULT 0,
    "winnerId" UUID,
    "tournamentWinnerId" UUID,
    "redLocked" BOOLEAN NOT NULL DEFAULT false,
    "blueLocked" BOOLEAN NOT NULL DEFAULT false,
    "groupId" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_profile" (
    "id" UUID NOT NULL,
    "athleteCode" TEXT,
    "name" TEXT NOT NULL,
    "nameSortKey" TEXT NOT NULL DEFAULT '',
    "gender" TEXT NOT NULL,
    "beltLevel" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "affiliation" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_athlete" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "athleteProfileId" UUID NOT NULL,
    "groupId" UUID,
    "seed" INTEGER,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'selected',
    "notes" TEXT,
    "name" TEXT NOT NULL,
    "nameSortKey" TEXT NOT NULL DEFAULT '',
    "gender" TEXT NOT NULL,
    "beltLevel" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "affiliation" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_athlete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_activity" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "adminId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_last_selection" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "deviceId" TEXT NOT NULL,
    "tournamentId" UUID,
    "groupId" UUID,
    "matchId" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_last_selection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "group_tournamentId_idx" ON "group"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "arena_match_claim_matchId_key" ON "arena_match_claim"("matchId");

-- CreateIndex
CREATE INDEX "arena_match_claim_tournamentId_idx" ON "arena_match_claim"("tournamentId");

-- CreateIndex
CREATE INDEX "arena_match_claim_groupId_idx" ON "arena_match_claim"("groupId");

-- CreateIndex
CREATE INDEX "arena_match_claim_expiresAt_idx" ON "arena_match_claim"("expiresAt");

-- CreateIndex
CREATE INDEX "match_groupId_idx" ON "match"("groupId");

-- CreateIndex
CREATE INDEX "match_tournamentId_idx" ON "match"("tournamentId");

-- CreateIndex
CREATE INDEX "match_tournamentId_displayLabel_idx" ON "match"("tournamentId", "displayLabel");

-- CreateIndex
CREATE INDEX "athlete_profile_athleteCode_idx" ON "athlete_profile"("athleteCode");

-- CreateIndex
CREATE INDEX "athlete_profile_name_affiliation_beltLevel_weight_idx" ON "athlete_profile"("name", "affiliation", "beltLevel", "weight");

-- CreateIndex
CREATE INDEX "tournament_athlete_tournamentId_idx" ON "tournament_athlete"("tournamentId");

-- CreateIndex
CREATE INDEX "tournament_athlete_groupId_idx" ON "tournament_athlete"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_athlete_tournamentId_athleteProfileId_key" ON "tournament_athlete"("tournamentId", "athleteProfileId");

-- CreateIndex
CREATE INDEX "tournament_activity_tournamentId_createdAt_idx" ON "tournament_activity"("tournamentId", "createdAt");

-- CreateIndex
CREATE INDEX "tournament_activity_eventType_idx" ON "tournament_activity"("eventType");

-- CreateIndex
CREATE INDEX "device_last_selection_deviceId_idx" ON "device_last_selection"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "device_last_selection_userId_deviceId_key" ON "device_last_selection"("userId", "deviceId");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group" ADD CONSTRAINT "group_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arena_match_claim" ADD CONSTRAINT "arena_match_claim_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_athlete" ADD CONSTRAINT "tournament_athlete_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_athlete" ADD CONSTRAINT "tournament_athlete_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "athlete_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_athlete" ADD CONSTRAINT "tournament_athlete_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_activity" ADD CONSTRAINT "tournament_activity_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_last_selection" ADD CONSTRAINT "device_last_selection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
