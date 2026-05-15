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

  static async releaseAllForDeviceInGroup(
    input: { groupId: string; deviceId: string },
    db: Pick<typeof prisma, 'arenaMatchClaim' | 'match'> = prisma
  ) {
    const claims = await db.arenaMatchClaim.findMany({
      where: { groupId: input.groupId, deviceId: input.deviceId },
      select: { matchId: true },
    });
    if (claims.length === 0) return;

    const matchIds = [...new Set(claims.map((c) => c.matchId))];

    await db.arenaMatchClaim.deleteMany({
      where: { groupId: input.groupId, deviceId: input.deviceId },
    });

    for (const mid of matchIds) {
      const m = await db.match.findUnique({
        where: { id: mid },
        select: { redWins: true, blueWins: true, status: true },
      });
      if (!m || m.status === 'complete') continue;
      const idle = m.redWins === 0 && m.blueWins === 0;
      await db.match.update({
        where: { id: mid },
        data: { status: idle ? 'pending' : 'active' },
      });
    }
  }

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
    await this.cleanupExpired(now);

    const match = await db.match.findUnique({
      where: { id: input.matchId },
      select: { id: true, groupId: true, tournamentId: true, status: true },
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

    await this.releaseAllForDeviceInGroup(
      {
        groupId: input.groupId,
        deviceId: input.deviceId,
      },
      db
    );

    const exp = this.expiresAt(now);
    const data = {
      deviceId: input.deviceId,
      userId: input.userId,
      groupId: input.groupId,
      tournamentId: input.tournamentId,
      expiresAt: exp,
    };

    const row = await db.arenaMatchClaim.upsert({
      where: { matchId: input.matchId },
      create: {
        matchId: input.matchId,
        ...data,
      },
      update: data,
    });

    if (match.status !== 'complete') {
      await db.match.update({
        where: { id: input.matchId },
        data: { status: 'active' },
      });
    }

    publishTournamentSelectionInvalidate(input.tournamentId);
    return row;
  }

  static async heartbeat(
    input: { matchId: string; deviceId: string; userId: string },
    db: Pick<typeof prisma, 'arenaMatchClaim'> = prisma
  ) {
    const now = new Date();
    await this.cleanupExpired(now);

    const row = await db.arenaMatchClaim.findUnique({
      where: { matchId: input.matchId },
    });

    if (!row || row.deviceId !== input.deviceId) {
      throw new Error('Match claim is not held by this device');
    }

    return db.arenaMatchClaim.update({
      where: { matchId: input.matchId },
      data: {
        expiresAt: this.expiresAt(now),
      },
    });
  }

  static async release(
    input: { matchId: string; deviceId: string; userId: string },
    db: Pick<typeof prisma, 'arenaMatchClaim' | 'match'> = prisma
  ) {
    const row = await db.arenaMatchClaim.findUnique({
      where: { matchId: input.matchId },
    });

    if (!row || row.deviceId !== input.deviceId) {
      return { removed: false as const };
    }

    const tournamentId = row.tournamentId;
    const matchId = row.matchId;
    await db.arenaMatchClaim.delete({
      where: { matchId: input.matchId },
    });

    const m = await db.match.findUnique({
      where: { id: matchId },
      select: { redWins: true, blueWins: true, status: true },
    });
    if (m && m.status !== 'complete') {
      const idle = m.redWins === 0 && m.blueWins === 0;
      await db.match.update({
        where: { id: matchId },
        data: { status: idle ? 'pending' : 'active' },
      });
    }

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
