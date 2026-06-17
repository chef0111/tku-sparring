export const TOURNAMENT_ACTIVITY_EVENT_TYPES = [
  'tournament.status_change',
  'tournament.delete',
  'bracket.generate',
  'bracket.reset',
  'bracket.shuffle',
  'bracket.regenerate',
  'match.score_edit',
  'match.winner_override',
  'match.status_admin',
  'match.swap_participants',
  'match.create_custom',
  'match.delete_custom',
  'group.athlete_assigned',
  'group.athlete_unassigned',
  'group.auto_assign',
] as const;

export type TournamentActivityEventType =
  (typeof TOURNAMENT_ACTIVITY_EVENT_TYPES)[number];
