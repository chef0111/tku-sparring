import type { MatchKind } from '@/contracts/tournament/match';
/** DB `kind` → domain {@link MatchKind}: only `custom` is custom; all other values are bracket. */
export function matchKindFromDb(kind: string | null | undefined): MatchKind {
  return kind === 'custom' ? 'custom' : 'bracket';
}

export function matchDisplayLabelFromDb(
  displayLabel: string | null | undefined
): string | null {
  return displayLabel ?? null;
}
