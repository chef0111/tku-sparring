import type { MatchData } from '@/features/dashboard/types';

export function normalizeMatchLabelKey(label: string): string {
  return label.trim().toLowerCase();
}

export type MatchLabelContext = {
  arenaIndex: number;
  groupIdsOnArena: Array<string>;
  allMatches: Array<MatchData>;
  numbers: Map<string, number | null>;
  assignedBracketTitleKeys: Set<string>;
};
