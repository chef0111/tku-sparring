import { validateCustomMatchLabel } from '@/server/domain/tournament/custom/label';
import { loadMatchLabelContext } from '@/server/infrastructure/tournament/match-label-context';
import { prisma } from '@/lib/db';

type LabelDb = Pick<typeof prisma, 'match'>;

export async function assertLabelAvailable(
  input: {
    tournamentId: string;
    divisionId: string;
    displayLabel: string;
    excludeMatchId?: string;
  },
  db: LabelDb = prisma
): Promise<void> {
  const customs = await db.match.findMany({
    where: {
      tournamentId: input.tournamentId,
      kind: 'custom',
      NOT: input.excludeMatchId ? { id: input.excludeMatchId } : undefined,
    },
    select: { displayLabel: true },
  });

  const { assignedBracketTitleKeys, allMatches } = await loadMatchLabelContext({
    tournamentId: input.tournamentId,
    divisionId: input.divisionId,
  });

  validateCustomMatchLabel(
    input.displayLabel,
    customs,
    assignedBracketTitleKeys,
    allMatches
  );
}
