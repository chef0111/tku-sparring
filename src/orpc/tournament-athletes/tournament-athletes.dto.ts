import { z } from 'zod';

export const BulkAddAthletesSchema = z.object({
  tournamentId: z.string(),
  athleteProfileIds: z
    .array(z.string())
    .min(1, 'At least one athlete is required'),
  autoAssign: z.boolean().optional().default(false),
});

export const UpdateTournamentAthleteSchema = z.object({
  id: z.string(),
  groupId: z.string().nullable().optional(),
  status: z.enum(['selected', 'assigned', 'eliminated']).optional(),
  seed: z.number().int().nullable().optional(),
  locked: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

export const ListTournamentAthletesSchema = z.object({
  tournamentId: z.string(),
  groupId: z.string().optional(),
  status: z.enum(['selected', 'assigned', 'eliminated']).optional(),
});

export type BulkAddAthletesDTO = z.infer<typeof BulkAddAthletesSchema>;
export type UpdateTournamentAthleteDTO = z.infer<
  typeof UpdateTournamentAthleteSchema
>;
export type ListTournamentAthletesDTO = z.infer<
  typeof ListTournamentAthletesSchema
>;
