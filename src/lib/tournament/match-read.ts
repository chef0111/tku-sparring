import {
  matchDisplayLabelFromDb,
  matchKindFromDb,
} from '@/lib/tournament/match-kind';

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
