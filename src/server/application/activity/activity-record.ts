import type { Prisma } from '@/generated/prisma/client';
import type { prisma } from '@/lib/db';

import type { TournamentActivityEventType } from '@/contracts/activity/event-types';

export type ActivityRecordInput = {
  tournamentId: string;
  adminId: string;
  eventType: TournamentActivityEventType;
  entityType: string;
  entityId: string;
  payload?: Prisma.InputJsonValue;
};

export type ActivityDatabase = Pick<typeof prisma, 'tournamentActivity'>;
