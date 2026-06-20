import type { ArenaMatchClaimStore } from '@/server/application/arena-match-claim/repositories/claim';
import type {
  ClaimMatchCommand,
  ReleaseClaimCommand,
} from '@/server/application/arena-match-claim/use-cases/claim-commands';
import { BadRequestError, NotFoundError } from '@/server/application/errors';
import { assertTournamentAction } from '@/server/application/policies/tournament-policy';
import { publishTournamentMutation } from '@/server/infrastructure/mutation-effects';
import { prisma } from '@/lib/db';

const CLAIM_TTL_MS = 30 * 60 * 1000;

type ClaimDb = Pick<typeof prisma, 'arenaMatchClaim' | 'match'>;

function expiresAt(now: Date) {
  return new Date(now.getTime() + CLAIM_TTL_MS);
}

async function cleanupExpired(
  now: Date,
  db: Pick<typeof prisma, 'arenaMatchClaim'> = prisma
) {
  await db.arenaMatchClaim.deleteMany({
    where: { expiresAt: { lte: now } },
  });
}

async function releaseAllForDeviceInGroup(
  input: { divisionId: string; deviceId: string },
  db: ClaimDb = prisma
) {
  const claims = await db.arenaMatchClaim.findMany({
    where: { divisionId: input.divisionId, deviceId: input.deviceId },
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
    where: { divisionId: input.divisionId, deviceId: input.deviceId },
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

export const arenaMatchClaimStore: ArenaMatchClaimStore = {
  async claim(command: ClaimMatchCommand) {
    const now = new Date();

    const row = await prisma.$transaction(async (tx) => {
      await cleanupExpired(now, tx);

      const match = await tx.match.findUnique({
        where: { id: command.matchId },
        select: {
          id: true,
          divisionId: true,
          tournamentId: true,
          status: true,
          tournament: { select: { status: true } },
        },
      });

      if (!match || match.divisionId !== command.divisionId) {
        throw new NotFoundError('Match not found for this group');
      }
      if (match.tournamentId !== command.tournamentId) {
        throw new BadRequestError('Match does not belong to this tournament');
      }
      assertTournamentAction(match.tournament.status, 'match.claim');

      const existing = await tx.arenaMatchClaim.findUnique({
        where: { matchId: command.matchId },
      });

      if (
        existing &&
        existing.expiresAt > now &&
        existing.deviceId !== command.deviceId
      ) {
        throw new BadRequestError('Match is in use on another device');
      }

      await releaseAllForDeviceInGroup(
        { divisionId: command.divisionId, deviceId: command.deviceId },
        tx
      );

      const exp = expiresAt(now);
      const data = {
        deviceId: command.deviceId,
        userId: command.userId,
        divisionId: command.divisionId,
        tournamentId: command.tournamentId,
        expiresAt: exp,
      };

      const claimRow = await tx.arenaMatchClaim.upsert({
        where: { matchId: command.matchId },
        create: { matchId: command.matchId, ...data },
        update: data,
      });

      if (match.status !== 'complete') {
        await tx.match.update({
          where: { id: command.matchId },
          data: { status: 'active' },
        });
      }

      return claimRow;
    });

    publishTournamentMutation(command.tournamentId);
    return row;
  },

  async release(command: ReleaseClaimCommand) {
    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.arenaMatchClaim.findUnique({
        where: { matchId: command.matchId },
      });

      if (!row || row.deviceId !== command.deviceId) {
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

      await tx.arenaMatchClaim.delete({ where: { matchId: command.matchId } });

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
  },
};
