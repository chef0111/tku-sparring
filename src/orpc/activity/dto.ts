import { z } from 'zod';
import { TournamentActivityEventTypeSchema } from './event-types';

export const ListTournamentActivitySchema = z.object({
  tournamentId: z.string(),
  eventTypes: z.array(TournamentActivityEventTypeSchema).max(20).optional(),
  cursor: z.object({ id: z.string() }).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export type ListTournamentActivityDTO = z.infer<
  typeof ListTournamentActivitySchema
>;
