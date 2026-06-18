import type {
  ActivityDatabase,
  ActivityRecordInput,
} from '@/server/application/activity/activity-record';
import { prisma } from '@/lib/db';

export async function recordTournamentActivity(
  input: ActivityRecordInput,
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
