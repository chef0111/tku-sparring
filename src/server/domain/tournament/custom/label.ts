import { normalizeMatchLabelKey } from '@/server/domain/tournament/arena/match-label-key';
import { CustomMatchValidationError } from '@/server/domain/tournament/custom/errors';

export type CustomLabelRow = { displayLabel: string | null };

export type LabelCollisionMatch = { id: string; kind: string };

export function validateCustomMatchLabel(
  displayLabel: string,
  customs: Array<CustomLabelRow>,
  assignedBracketTitleKeys: Set<string>,
  bracketMatches: Array<LabelCollisionMatch>
): void {
  const trimmed = displayLabel.trim();
  if (!trimmed) {
    throw new CustomMatchValidationError('Match label is required');
  }
  const key = normalizeMatchLabelKey(trimmed);

  for (const c of customs) {
    const d = c.displayLabel?.trim();
    if (d && normalizeMatchLabelKey(d) === key) {
      throw new CustomMatchValidationError(
        'That label is already used by another custom match'
      );
    }
  }

  if (assignedBracketTitleKeys.has(key)) {
    throw new CustomMatchValidationError(
      'That label matches an existing arena match number'
    );
  }

  const matchKey = /^match\s+(.+)$/i.exec(trimmed);
  if (matchKey) {
    const tail = matchKey[1]!.trim().toLowerCase();
    for (const m of bracketMatches) {
      if (m.kind === 'custom') continue;
      const suffix = m.id.slice(-6).toLowerCase();
      if (tail === suffix) {
        throw new CustomMatchValidationError(
          'That label collides with an auto-generated match label'
        );
      }
    }
  }
}
