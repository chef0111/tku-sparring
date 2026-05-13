import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

type RecordTournamentActivityInput = {
  tournamentId: string;
  adminId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  payload?: Prisma.InputJsonValue;
};

type ActivityDatabase = Pick<typeof prisma, 'tournamentActivity'>;

export async function recordTournamentActivity(
  input: RecordTournamentActivityInput,
  db: ActivityDatabase = prisma
) {
  const { payload = {}, ...data } = input;

  return db.tournamentActivity.create({
    data: {
      ...data,
      payload,
    },
  });
}
