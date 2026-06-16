import { z } from 'zod';
import type { Prisma } from '@/generated/prisma/client';
import type { prisma } from '@/lib/db';
import type { TournamentActivityEventType } from '@/server/application/activity/activity-types';
import { TOURNAMENT_ACTIVITY_EVENT_TYPES } from '@/server/application/activity/activity-types';

export { TOURNAMENT_ACTIVITY_EVENT_TYPES } from '@/server/application/activity/activity-types';
export type { TournamentActivityEventType } from '@/server/application/activity/activity-types';

export type ActivityInput = {
  tournamentId: string;
  adminId: string;
  eventType: TournamentActivityEventType;
  entityType: string;
  entityId: string;
  payload?: Prisma.InputJsonValue;
};

export type ActivityDatabase = Pick<typeof prisma, 'tournamentActivity'>;

export const TournamentActivityEventTypeSchema = z.enum(
  TOURNAMENT_ACTIVITY_EVENT_TYPES
);
