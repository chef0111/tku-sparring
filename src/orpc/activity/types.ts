import { z } from 'zod';
import type { Prisma } from '@/generated/prisma/client';
import type { prisma } from '@/lib/db';

export type ActivityInput = {
  tournamentId: string;
  adminId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  payload?: Prisma.InputJsonValue;
};

export type ActivityDatabase = Pick<typeof prisma, 'tournamentActivity'>;

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
  'match.create_custom',
  'group.athlete_assigned',
  'group.athlete_unassigned',
  'group.auto_assign',
] as const;

export type TournamentActivityEventType =
  (typeof TOURNAMENT_ACTIVITY_EVENT_TYPES)[number];

export const TournamentActivityEventTypeSchema = z.enum(
  TOURNAMENT_ACTIVITY_EVENT_TYPES
);
