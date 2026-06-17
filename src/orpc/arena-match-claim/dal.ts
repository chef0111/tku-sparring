import { prisma } from '@/lib/db';
import { publishTournamentMutation } from '@/orpc/mutation-effects';
import { assertTournamentAction } from '@/server/application/policies/tournament-policy';

const CLAIM_TTL_MS = 30 * 60 * 1000;

type ClaimDb = Pick<typeof prisma, 'arenaMatchClaim' | 'match'>;

export class ArenaMatchClaimDAL {
  private static expiresAt(now: Date) {
    return new Date(now.getTime() + CLAIM_TTL_MS);
  }

  static async cleanupExpired(
    now: Date,
    db: Pick<typeof prisma, 'arenaMatchClaim'> = prisma
  ) {
    await db.arenaMatchClaim.deleteMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    });
  }

  static async releaseAllForDeviceInGroup(
    input: { groupId: string; deviceId: string },
    db: ClaimDb = prisma
  ) {
    const claims = await db.arenaMatchClaim.findMany({
      where: { groupId: input.groupId, deviceId: input.deviceId },
      select: { matchId: true },
    });
    if (claims.length === 0) return;

    const matchIds = [...new Set(claims.map((c) => c.matchId))];
    const matches = await Promise.all(
      matchIds.map((mid) =>
        db.match.findUnique({
          where: { id: mid },
          select: {
            redWins: true,
            blueWins: true,
            status: true,
            tournament: { select: { status: true } },
          },
        })
      )
    );
    for (const match of matches) {
      if (match) assertTournamentAction(match.tournament.status, 'match.claim');
    }

    await db.arenaMatchClaim.deleteMany({
      where: { groupId: input.groupId, deviceId: input.deviceId },
    });

    for (const [index, mid] of matchIds.entries()) {
      const m = matches[index];
      if (!m || m.status === 'complete') continue;
      const idle = m.redWins === 0 && m.blueWins === 0;
      await db.match.update({
        where: { id: mid },
        data: { status: idle ? 'pending' : 'active' },
      });
    }
  }

  static async claim(input: {
    matchId: string;
    groupId: string;
    tournamentId: string;
    deviceId: string;
    userId: string;
  }) {
    const now = new Date();

    const row = await prisma.$transaction(async (tx) => {
      await ArenaMatchClaimDAL.cleanupExpired(now, tx);

      const match = await tx.match.findUnique({
        where: { id: input.matchId },
        select: {
          id: true,
          groupId: true,
          tournamentId: true,
          status: true,
          tournament: { select: { status: true } },
        },
      });

      if (!match || match.groupId !== input.groupId) {
        throw new Error('Match not found for this group');
      }
      if (match.tournamentId !== input.tournamentId) {
        throw new Error('Match does not belong to this tournament');
      }
      assertTournamentAction(match.tournament.status, 'match.claim');

      const existing = await tx.arenaMatchClaim.findUnique({
        where: { matchId: input.matchId },
      });

      if (
        existing &&
        existing.expiresAt > now &&
        existing.deviceId !== input.deviceId
      ) {
        throw new Error('Match is in use on another device');
      }

      await ArenaMatchClaimDAL.releaseAllForDeviceInGroup(
        {
          groupId: input.groupId,
          deviceId: input.deviceId,
        },
        tx
      );

      const exp = ArenaMatchClaimDAL.expiresAt(now);
      const data = {
        deviceId: input.deviceId,
        userId: input.userId,
        groupId: input.groupId,
        tournamentId: input.tournamentId,
        expiresAt: exp,
      };

      const claimRow = await tx.arenaMatchClaim.upsert({
        where: { matchId: input.matchId },
        create: {
          matchId: input.matchId,
          ...data,
        },
        update: data,
      });

      if (match.status !== 'complete') {
        await tx.match.update({
          where: { id: input.matchId },
          data: { status: 'active' },
        });
      }

      return claimRow;
    });

    publishTournamentMutation(input.tournamentId);
    return row;
  }

  static async release(input: {
    matchId: string;
    deviceId: string;
    userId: string;
  }) {
    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.arenaMatchClaim.findUnique({
        where: { matchId: input.matchId },
      });

      if (!row || row.deviceId !== input.deviceId) {
        return { removed: false as const, tournamentId: null as string | null };
      }

      const tournamentId = row.tournamentId;
      const matchId = row.matchId;
      const m = await tx.match.findUnique({
        where: { id: matchId },
        select: {
          redWins: true,
          blueWins: true,
          status: true,
          tournament: { select: { status: true } },
        },
      });
      if (m) assertTournamentAction(m.tournament.status, 'match.claim');

      await tx.arenaMatchClaim.delete({
        where: { matchId: input.matchId },
      });

      if (m && m.status !== 'complete') {
        const idle = m.redWins === 0 && m.blueWins === 0;
        await tx.match.update({
          where: { id: matchId },
          data: { status: idle ? 'pending' : 'active' },
        });
      }

      return { removed: true as const, tournamentId };
    });

    if (result.removed && result.tournamentId) {
      publishTournamentMutation(result.tournamentId);
    }

    return { removed: result.removed };
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
