import { coalesceMatchRead } from '@/server/domain/tournament/match/match-read';
import { prisma } from '@/lib/db';

export { coalesceMatchRead };

export async function findMatchesByGroupId(groupId: string) {
  const rows = await prisma.match.findMany({
    where: { groupId },
    orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
  });
  return rows.map((m) => coalesceMatchRead(m));
}
