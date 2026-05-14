import { prisma } from '@/lib/db';

export type LastSelectionPayload = {
  tournamentId: string | null;
  groupId: string | null;
  matchId: string | null;
};

export class DeviceLastSelectionDAL {
  static async getForUserDevice(
    userId: string,
    deviceId: string
  ): Promise<LastSelectionPayload | null> {
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
  }

  static async upsertForUserDevice(
    userId: string,
    input: {
      deviceId: string;
      tournamentId?: string | null;
      groupId?: string | null;
      matchId?: string | null;
    }
  ) {
    const { deviceId } = input;
    let tournamentId =
      input.tournamentId === undefined ? null : input.tournamentId;
    let groupId = input.groupId === undefined ? null : input.groupId;
    const matchId = input.matchId === undefined ? null : input.matchId;

    if (matchId) {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: { groupId: true, tournamentId: true },
      });
      if (!match) {
        throw new Error('Match not found');
      }
      if (groupId && match.groupId !== groupId) {
        throw new Error('Match does not belong to the given group');
      }
      if (tournamentId && match.tournamentId !== tournamentId) {
        throw new Error('Match does not belong to the given tournament');
      }
      groupId = match.groupId;
      tournamentId = match.tournamentId;
    } else if (groupId) {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { tournamentId: true },
      });
      if (!group) {
        throw new Error('Group not found');
      }
      if (tournamentId && group.tournamentId !== tournamentId) {
        throw new Error('Group does not belong to the given tournament');
      }
      tournamentId = group.tournamentId;
    } else if (tournamentId) {
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { id: true },
      });
      if (!tournament) {
        throw new Error('Tournament not found');
      }
    }

    return prisma.deviceLastSelection.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      create: {
        userId,
        deviceId,
        tournamentId,
        groupId,
        matchId,
      },
      update: {
        tournamentId,
        groupId,
        matchId,
      },
    });
  }
}
