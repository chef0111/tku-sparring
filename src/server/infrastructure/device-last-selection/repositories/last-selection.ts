import type { DeviceLastSelectionStore } from '@/server/application/device-last-selection/repositories/last-selection';
import type {
  GetLastSelectionQuery,
  SetLastSelectionCommand,
} from '@/server/application/device-last-selection/use-cases/commands';
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
      groupId: row.groupId,
      matchId: row.matchId,
    };
  },

  async findMatchContext(matchId) {
    return prisma.match.findUnique({
      where: { id: matchId },
      select: { groupId: true, tournamentId: true },
    });
  },

  async findGroupContext(groupId) {
    return prisma.group.findUnique({
      where: { id: groupId },
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
    const { userId, deviceId, tournamentId, groupId, matchId } = command;
    const row = await prisma.deviceLastSelection.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      create: {
        userId,
        deviceId,
        tournamentId: tournamentId ?? null,
        groupId: groupId ?? null,
        matchId: matchId ?? null,
      },
      update: {
        tournamentId: tournamentId ?? null,
        groupId: groupId ?? null,
        matchId: matchId ?? null,
      },
    });
    return {
      tournamentId: row.tournamentId,
      groupId: row.groupId,
      matchId: row.matchId,
    };
  },
};
