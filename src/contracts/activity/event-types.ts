/** Activity audit event vocabulary shared by client, oRPC, and server. */
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
  'division.athlete_assigned',
  'division.athlete_unassigned',
  'division.auto_assign',
] as const;

export type TournamentActivityEventType =
  (typeof TOURNAMENT_ACTIVITY_EVENT_TYPES)[number];
