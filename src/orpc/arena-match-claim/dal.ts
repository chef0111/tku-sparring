import { prisma } from '@/lib/db';
import { publishTournamentSelectionInvalidate } from '@/lib/tournament/tournament-sse-bus';

const CLAIM_TTL_MS = 60_000;

export class ArenaMatchClaimDAL {
  private static expiresAt(now: Date) {
    return new Date(now.getTime() + CLAIM_TTL_MS);
  }

  static async cleanupExpired(now: Date) {
    await prisma.arenaMatchClaim.deleteMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    });
  }

  static async releaseAllForDeviceInGroup(input: {
    groupId: string;
    deviceId: string;
  }) {
    await prisma.arenaMatchClaim.deleteMany({
      where: {
        groupId: input.groupId,
        deviceId: input.deviceId,
      },
    });
  }

  /**
   * Creates or refreshes the claim for this device on the match.
   * Fails if another non-expired holder exists.
   */
  static async claim(
    input: {
      matchId: string;
      groupId: string;
      tournamentId: string;
      deviceId: string;
      userId: string;
    },
    db: Pick<typeof prisma, 'arenaMatchClaim' | 'match'> = prisma
  ) {
    const now = new Date();
    await ArenaMatchClaimDAL.cleanupExpired(now);

    const match = await db.match.findUnique({
      where: { id: input.matchId },
      select: { id: true, groupId: true, tournamentId: true },
    });

    if (!match || match.groupId !== input.groupId) {
      throw new Error('Match not found for this group');
    }
    if (match.tournamentId !== input.tournamentId) {
      throw new Error('Match does not belong to this tournament');
    }

    const existing = await db.arenaMatchClaim.findUnique({
      where: { matchId: input.matchId },
    });

    if (
      existing &&
      existing.expiresAt > now &&
      existing.deviceId !== input.deviceId
    ) {
      throw new Error('Match is in use on another device');
    }

    const exp = ArenaMatchClaimDAL.expiresAt(now);
    const data = {
      deviceId: input.deviceId,
      userId: input.userId,
      groupId: input.groupId,
      tournamentId: input.tournamentId,
      expiresAt: exp,
    };

    const row = existing
      ? await db.arenaMatchClaim.update({
          where: { matchId: input.matchId },
          data,
        })
      : await db.arenaMatchClaim.create({
          data: {
            matchId: input.matchId,
            ...data,
          },
        });

    publishTournamentSelectionInvalidate(input.tournamentId);
    return row;
  }

  static async heartbeat(
    input: { matchId: string; deviceId: string; userId: string },
    db: Pick<typeof prisma, 'arenaMatchClaim'> = prisma
  ) {
    const now = new Date();
    await ArenaMatchClaimDAL.cleanupExpired(now);

    const row = await db.arenaMatchClaim.findUnique({
      where: { matchId: input.matchId },
    });

    if (!row || row.deviceId !== input.deviceId) {
      throw new Error('Match claim is not held by this device');
    }

    return db.arenaMatchClaim.update({
      where: { matchId: input.matchId },
      data: {
        expiresAt: ArenaMatchClaimDAL.expiresAt(now),
      },
    });
  }

  static async release(
    input: { matchId: string; deviceId: string; userId: string },
    db: Pick<typeof prisma, 'arenaMatchClaim'> = prisma
  ) {
    const row = await db.arenaMatchClaim.findUnique({
      where: { matchId: input.matchId },
    });

    if (!row || row.deviceId !== input.deviceId) {
      return { removed: false as const };
    }

    const tournamentId = row.tournamentId;
    await db.arenaMatchClaim.delete({
      where: { matchId: input.matchId },
    });

    publishTournamentSelectionInvalidate(tournamentId);
    return { removed: true as const };
  }

  /** For selection list: active claims for these matches (non-expired). */
  static async activeClaimsByMatchId(
    matchIds: Array<string>,
    now: Date
  ): Promise<Map<string, { deviceId: string }>> {
    if (matchIds.length === 0) {
      return new Map();
    }
    const rows = await prisma.arenaMatchClaim.findMany({
      where: {
        matchId: { in: matchIds },
        expiresAt: { gt: now },
      },
      select: { matchId: true, deviceId: true },
    });
    return new Map(rows.map((r) => [r.matchId, { deviceId: r.deviceId }]));
  }
}
