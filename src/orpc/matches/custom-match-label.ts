import { throwMatchBadRequest } from './match-domain-error';
import {
  loadMatchLabelContext,
  normalizeMatchLabelKey,
} from '@/lib/tournament/match-label-context';
import { prisma } from '@/lib/db';

export { normalizeMatchLabelKey };

/**
 * Ensures `displayLabel` does not collide with another custom label (tournament-wide)
 * or an arena-assigned `Match {n}` title for this group's arena (cross-group on same arena).
 */
export async function assertLabelAvailable(input: {
  tournamentId: string;
  groupId: string;
  displayLabel: string;
  excludeMatchId?: string;
}): Promise<void> {
  const trimmed = input.displayLabel.trim();
  if (!trimmed) {
    throwMatchBadRequest('Match label is required');
  }
  const key = normalizeMatchLabelKey(trimmed);

  const customs = await prisma.match.findMany({
    where: {
      tournamentId: input.tournamentId,
      kind: 'custom',
      NOT: input.excludeMatchId ? { id: input.excludeMatchId } : undefined,
    },
    select: { id: true, displayLabel: true },
  });
  for (const c of customs) {
    const d = c.displayLabel?.trim();
    if (d && normalizeMatchLabelKey(d) === key) {
      throwMatchBadRequest(
        'That label is already used by another custom match'
      );
    }
  }

  const { assignedBracketTitleKeys, allMatches } = await loadMatchLabelContext({
    tournamentId: input.tournamentId,
    groupId: input.groupId,
  });

  if (assignedBracketTitleKeys.has(key)) {
    throwMatchBadRequest('That label matches an existing arena match number');
  }

  const matchKey = /^match\s+(.+)$/i.exec(trimmed);
  if (matchKey) {
    const tail = matchKey[1]!.trim().toLowerCase();
    for (const m of allMatches) {
      if (m.kind === 'custom') continue;
      const suffix = m.id.slice(-6).toLowerCase();
      if (tail === suffix) {
        throwMatchBadRequest(
          'That label collides with an auto-generated match label'
        );
      }
    }
  }
}
