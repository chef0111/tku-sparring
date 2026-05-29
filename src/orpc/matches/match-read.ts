import {
  matchDisplayLabelFromDb,
  matchKindFromDb,
} from '@/lib/tournament/match-kind';
import { prisma } from '@/lib/db';

export function coalesceMatchRead<
  T extends {
    kind?: string | null;
    displayLabel?: string | null;
  },
>(m: T): T & { kind: 'bracket' | 'custom'; displayLabel: string | null } {
  return {
    ...m,
    kind: matchKindFromDb(m.kind),
    displayLabel: matchDisplayLabelFromDb(m.displayLabel),
  };
}

export async function findMatchesByGroupId(groupId: string) {
  const rows = await prisma.match.findMany({
    where: { groupId },
    orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
  });
  return rows.map((m) => coalesceMatchRead(m));
}
