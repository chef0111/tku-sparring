import { z } from 'zod';

export const TOURNAMENT_ACTIVITY_EVENT_TYPES = [
  'tournament.status_change',
  'bracket.generate',
  'bracket.reset',
  'bracket.shuffle',
  'bracket.regenerate',
  'match.score_edit',
  'match.winner_override',
  'match.status_admin',
  'match.swap_participants',
  'group.athlete_assigned',
  'group.athlete_unassigned',
  'group.auto_assign',
] as const;

export type TournamentActivityEventType =
  (typeof TOURNAMENT_ACTIVITY_EVENT_TYPES)[number];

export const TournamentActivityEventTypeSchema = z.enum(
  TOURNAMENT_ACTIVITY_EVENT_TYPES
);
