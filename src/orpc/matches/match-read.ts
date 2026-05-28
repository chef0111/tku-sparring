import { prisma } from '@/lib/db';

export function coalesceMatchRead<
  T extends {
    kind?: string | null;
    displayLabel?: string | null;
  },
>(m: T): T & { kind: 'bracket' | 'custom'; displayLabel: string | null } {
  return {
    ...m,
    kind: m.kind === 'custom' ? 'custom' : 'bracket',
    displayLabel: m.displayLabel ?? null,
  };
}

export async function findMatchesByGroupId(groupId: string) {
  const rows = await prisma.match.findMany({
    where: { groupId },
    orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
  });
  return rows.map((m) => coalesceMatchRead(m));
}
