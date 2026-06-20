import type { DeviceLastSelectionStore } from '@/server/application/device-last-selection/repositories/last-selection';
import type { SetLastSelectionCommand } from '@/server/application/device-last-selection/use-cases/commands';
import { prisma } from '@/lib/db';

export const deviceLastSelectionStore: DeviceLastSelectionStore = {
  async find({ userId, deviceId }) {
    const row = await prisma.deviceLastSelection.findUnique({
      where: { userId_deviceId: { userId, deviceId } },
    });
    if (!row) {
      return null;
    }
    return {
      tournamentId: row.tournamentId,
      divisionId: row.divisionId,
      matchId: row.matchId,
    };
  },

  async findMatchContext(matchId) {
    return prisma.match.findUnique({
      where: { id: matchId },
      select: { divisionId: true, tournamentId: true },
    });
  },

  async findDivisionContext(divisionId) {
    return prisma.division.findUnique({
      where: { id: divisionId },
      select: { tournamentId: true },
    });
  },

  async existsTournament(tournamentId) {
    const row = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true },
    });
    return row != null;
  },

  async upsert(command: SetLastSelectionCommand) {
    const { userId, deviceId, tournamentId, divisionId, matchId } = command;
    const row = await prisma.deviceLastSelection.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      create: {
        userId,
        deviceId,
        tournamentId: tournamentId ?? null,
        divisionId: divisionId ?? null,
        matchId: matchId ?? null,
      },
      update: {
        tournamentId: tournamentId ?? null,
        divisionId: divisionId ?? null,
        matchId: matchId ?? null,
      },
    });
    return {
      tournamentId: row.tournamentId,
      divisionId: row.divisionId,
      matchId: row.matchId,
    };
  },
};
