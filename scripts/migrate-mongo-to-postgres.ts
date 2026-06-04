/**
 * One-time MongoDB → PostgreSQL data migration.
 * Reads MONGO_DATABASE_URL, writes to DIRECT_DATABASE_URL (or DATABASE_URL).
 *
 * Usage: bun run db:migrate:data [--force]
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { MongoClient } from 'mongodb';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import type { ObjectId } from 'mongodb';

const force = process.argv.includes('--force');

type IdMaps = {
  user: Record<string, string>;
  athleteProfile: Record<string, string>;
  tournament: Record<string, string>;
  group: Record<string, string>;
  tournamentAthlete: Record<string, string>;
  match: Record<string, string>;
};

function mongoId(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    return (value as ObjectId).toString();
  }
  return String(value);
}

function mapId(map: Record<string, string>, value: unknown): string {
  const key = mongoId(value);
  const next = map[key];
  if (!next) {
    throw new Error(`Missing id map for ${key}`);
  }
  return next;
}

function mapOptionalId(
  map: Record<string, string>,
  value: unknown
): string | null {
  if (value == null || value === '') return null;
  const key = mongoId(value);
  if (!key) return null;
  return map[key] ?? null;
}

function createPrisma() {
  const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DIRECT_DATABASE_URL or DATABASE_URL is required');
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

async function assertEmpty(prisma: PrismaClient) {
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.tournament.count(),
    prisma.athleteProfile.count(),
  ]);
  const total = counts.reduce((a, b) => a + b, 0);
  if (total > 0 && !force) {
    throw new Error(
      'Postgres already has data. Pass --force after clearing tables or use a fresh database.'
    );
  }
}

async function clearPostgres(prisma: PrismaClient) {
  console.log('Clearing Postgres tables…');
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      device_last_selection,
      tournament_activity,
      arena_match_claim,
      match,
      tournament_athlete,
      "group",
      tournament,
      athlete_profile,
      session,
      account,
      verification,
      "user"
    CASCADE
  `);
}

async function main() {
  console.log('Starting Mongo → Postgres migration…');

  const mongoUrl = process.env.MONGO_DATABASE_URL;
  if (!mongoUrl) {
    throw new Error('MONGO_DATABASE_URL is not set');
  }

  const prisma = createPrisma();
  const mongo = new MongoClient(mongoUrl);

  const maps: IdMaps = {
    user: {},
    athleteProfile: {},
    tournament: {},
    group: {},
    tournamentAthlete: {},
    match: {},
  };

  try {
    console.log('Connecting to MongoDB…');
    await mongo.connect();
    const db = mongo.db();
    console.log('Connected to MongoDB.');

    await assertEmpty(prisma);

    if (force) {
      await clearPostgres(prisma);
    }

    const users = await db.collection('user').find().toArray();
    for (const doc of users) {
      const oldId = mongoId(doc._id);
      const id = randomUUID();
      maps.user[oldId] = id;
      await prisma.user.create({
        data: {
          id,
          name: doc.name as string,
          email: doc.email as string,
          emailVerified: Boolean(doc.emailVerified),
          image: (doc.image as string | null) ?? null,
          createdAt: doc.createdAt as Date,
          updatedAt: doc.updatedAt as Date,
          username: (doc.username as string | null) ?? null,
          displayUsername: (doc.displayUsername as string | null) ?? null,
        },
      });
    }
    console.log(`user: ${users.length}`);

    const accounts = await db.collection('account').find().toArray();
    for (const doc of accounts) {
      await prisma.account.create({
        data: {
          id: randomUUID(),
          accountId: doc.accountId as string,
          providerId: doc.providerId as string,
          userId: mapId(maps.user, doc.userId),
          accessToken: (doc.accessToken as string | null) ?? null,
          refreshToken: (doc.refreshToken as string | null) ?? null,
          idToken: (doc.idToken as string | null) ?? null,
          accessTokenExpiresAt:
            (doc.accessTokenExpiresAt as Date | null) ?? null,
          refreshTokenExpiresAt:
            (doc.refreshTokenExpiresAt as Date | null) ?? null,
          scope: (doc.scope as string | null) ?? null,
          password: (doc.password as string | null) ?? null,
          createdAt: doc.createdAt as Date,
          updatedAt: doc.updatedAt as Date,
        },
      });
    }
    console.log(`account: ${accounts.length}`);

    const sessions = await db.collection('session').find().toArray();
    for (const doc of sessions) {
      await prisma.session.create({
        data: {
          id: randomUUID(),
          expiresAt: doc.expiresAt as Date,
          token: doc.token as string,
          createdAt: doc.createdAt as Date,
          updatedAt: doc.updatedAt as Date,
          ipAddress: (doc.ipAddress as string | null) ?? null,
          userAgent: (doc.userAgent as string | null) ?? null,
          userId: mapId(maps.user, doc.userId),
        },
      });
    }
    console.log(`session: ${sessions.length}`);

    const verifications = await db.collection('verification').find().toArray();
    for (const doc of verifications) {
      await prisma.verification.create({
        data: {
          id: randomUUID(),
          identifier: doc.identifier as string,
          value: doc.value as string,
          expiresAt: doc.expiresAt as Date,
          createdAt: doc.createdAt as Date,
          updatedAt: doc.updatedAt as Date,
        },
      });
    }
    console.log(`verification: ${verifications.length}`);

    const profiles = await db.collection('athlete_profile').find().toArray();
    for (const doc of profiles) {
      const oldId = mongoId(doc._id);
      const id = randomUUID();
      maps.athleteProfile[oldId] = id;
      await prisma.athleteProfile.create({
        data: {
          id,
          athleteCode: (doc.athleteCode as string | null) ?? null,
          name: doc.name as string,
          nameSortKey: (doc.nameSortKey as string) ?? '',
          gender: doc.gender as string,
          beltLevel: doc.beltLevel as number,
          weight: doc.weight as number,
          affiliation: doc.affiliation as string,
          image: (doc.image as string | null) ?? null,
          createdAt: doc.createdAt as Date,
          updatedAt: doc.updatedAt as Date,
        },
      });
    }
    console.log(`athlete_profile: ${profiles.length}`);

    const tournaments = await db.collection('tournament').find().toArray();
    for (const doc of tournaments) {
      const oldId = mongoId(doc._id);
      const id = randomUUID();
      maps.tournament[oldId] = id;
      await prisma.tournament.create({
        data: {
          id,
          name: doc.name as string,
          nameSortKey: (doc.nameSortKey as string) ?? '',
          status: (doc.status as string) ?? 'draft',
          arenaGroupOrder: doc.arenaGroupOrder ?? undefined,
          createdAt: doc.createdAt as Date,
          updatedAt: doc.updatedAt as Date,
        },
      });
    }
    console.log(`tournament: ${tournaments.length}`);

    const groups = await db.collection('group').find().toArray();
    for (const doc of groups) {
      const oldId = mongoId(doc._id);
      const id = randomUUID();
      maps.group[oldId] = id;
      await prisma.group.create({
        data: {
          id,
          name: doc.name as string,
          tournamentId: mapId(maps.tournament, doc.tournamentId),
          gender: (doc.gender as string | null) ?? null,
          beltMin: (doc.beltMin as number | null) ?? null,
          beltMax: (doc.beltMax as number | null) ?? null,
          weightMin: (doc.weightMin as number | null) ?? null,
          weightMax: (doc.weightMax as number | null) ?? null,
          thirdPlaceMatch: Boolean(doc.thirdPlaceMatch),
          arenaIndex: (doc.arenaIndex as number) ?? 1,
          round0Baseline: doc.round0Baseline ?? undefined,
          createdAt: doc.createdAt as Date,
          updatedAt: doc.updatedAt as Date,
        },
      });
    }
    console.log(`group: ${groups.length}`);

    const tournamentAthletes = await db
      .collection('tournament_athlete')
      .find()
      .toArray();
    for (const doc of tournamentAthletes) {
      const oldId = mongoId(doc._id);
      const id = randomUUID();
      maps.tournamentAthlete[oldId] = id;
      await prisma.tournamentAthlete.create({
        data: {
          id,
          tournamentId: mapId(maps.tournament, doc.tournamentId),
          athleteProfileId: mapId(maps.athleteProfile, doc.athleteProfileId),
          groupId: mapOptionalId(maps.group, doc.groupId),
          seed: (doc.seed as number | null) ?? null,
          locked: Boolean(doc.locked),
          status: (doc.status as string) ?? 'selected',
          notes: (doc.notes as string | null) ?? null,
          name: doc.name as string,
          nameSortKey: (doc.nameSortKey as string) ?? '',
          gender: doc.gender as string,
          beltLevel: doc.beltLevel as number,
          weight: doc.weight as number,
          affiliation: doc.affiliation as string,
          image: (doc.image as string | null) ?? null,
          createdAt: doc.createdAt as Date,
          updatedAt: doc.updatedAt as Date,
        },
      });
    }
    console.log(`tournament_athlete: ${tournamentAthletes.length}`);

    const matches = await db.collection('match').find().toArray();
    for (const doc of matches) {
      const oldId = mongoId(doc._id);
      const id = randomUUID();
      maps.match[oldId] = id;
      await prisma.match.create({
        data: {
          id,
          kind: (doc.kind as string) ?? 'bracket',
          displayLabel: (doc.displayLabel as string | null) ?? null,
          round: (doc.round as number) ?? 0,
          matchIndex: (doc.matchIndex as number) ?? 0,
          status: (doc.status as string) ?? 'pending',
          redAthleteId: mapOptionalId(maps.athleteProfile, doc.redAthleteId),
          blueAthleteId: mapOptionalId(maps.athleteProfile, doc.blueAthleteId),
          redTournamentAthleteId: mapOptionalId(
            maps.tournamentAthlete,
            doc.redTournamentAthleteId
          ),
          blueTournamentAthleteId: mapOptionalId(
            maps.tournamentAthlete,
            doc.blueTournamentAthleteId
          ),
          redWins: (doc.redWins as number) ?? 0,
          blueWins: (doc.blueWins as number) ?? 0,
          winnerId: mapOptionalId(maps.athleteProfile, doc.winnerId),
          tournamentWinnerId: mapOptionalId(
            maps.athleteProfile,
            doc.tournamentWinnerId
          ),
          redLocked: Boolean(doc.redLocked),
          blueLocked: Boolean(doc.blueLocked),
          groupId: mapId(maps.group, doc.groupId),
          tournamentId: mapId(maps.tournament, doc.tournamentId),
          createdAt: doc.createdAt as Date,
          updatedAt: doc.updatedAt as Date,
        },
      });
    }
    console.log(`match: ${matches.length}`);

    const claims = await db.collection('arena_match_claim').find().toArray();
    for (const doc of claims) {
      await prisma.arenaMatchClaim.create({
        data: {
          id: randomUUID(),
          matchId: mapId(maps.match, doc.matchId),
          groupId: mapId(maps.group, doc.groupId),
          tournamentId: mapId(maps.tournament, doc.tournamentId),
          deviceId: doc.deviceId as string,
          userId: mapId(maps.user, doc.userId),
          expiresAt: doc.expiresAt as Date,
          updatedAt: doc.updatedAt as Date,
        },
      });
    }
    console.log(`arena_match_claim: ${claims.length}`);

    const activities = await db
      .collection('tournament_activity')
      .find()
      .toArray();
    for (const doc of activities) {
      await prisma.tournamentActivity.create({
        data: {
          id: randomUUID(),
          tournamentId: mapId(maps.tournament, doc.tournamentId),
          adminId: mapId(maps.user, doc.adminId),
          eventType: doc.eventType as string,
          entityType: doc.entityType as string,
          entityId: doc.entityId as string,
          payload: doc.payload as object,
          createdAt: doc.createdAt as Date,
        },
      });
    }
    console.log(`tournament_activity: ${activities.length}`);

    const selections = await db
      .collection('device_last_selection')
      .find()
      .toArray();
    for (const doc of selections) {
      await prisma.deviceLastSelection.create({
        data: {
          id: randomUUID(),
          userId: mapId(maps.user, doc.userId),
          deviceId: doc.deviceId as string,
          tournamentId: mapOptionalId(maps.tournament, doc.tournamentId),
          groupId: mapOptionalId(maps.group, doc.groupId),
          matchId: mapOptionalId(maps.match, doc.matchId),
          updatedAt: doc.updatedAt as Date,
        },
      });
    }
    console.log(`device_last_selection: ${selections.length}`);

    const audit = {
      migratedAt: new Date().toISOString(),
      counts: {
        user: users.length,
        account: accounts.length,
        session: sessions.length,
        verification: verifications.length,
        athlete_profile: profiles.length,
        tournament: tournaments.length,
        group: groups.length,
        tournament_athlete: tournamentAthletes.length,
        match: matches.length,
        arena_match_claim: claims.length,
        tournament_activity: activities.length,
        device_last_selection: selections.length,
      },
      maps,
    };

    writeFileSync(
      'scripts/migration-id-map.json',
      JSON.stringify(audit, null, 2)
    );
    console.log('Wrote scripts/migration-id-map.json');
    console.log('Migration complete.');
  } finally {
    await prisma.$disconnect();
    await mongo.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
