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
  unassignedOnly: z.boolean().optional().default(false),
  page: z.number().int().min(1).optional().default(1),
  perPage: z.number().int().min(1).max(200).optional().default(30),
  query: z.string().optional(),
  gender: z
    .array(z.enum(['M', 'F']))
    .min(1)
    .max(2)
    .optional(),
  beltLevels: z
    .array(z.number().int().min(0).max(10))
    .min(1)
    .max(20)
    .optional(),
  beltLevelMin: z.number().int().min(0).max(10).optional(),
  beltLevelMax: z.number().int().min(0).max(10).optional(),
  weightMin: z.number().min(0).optional(),
  weightMax: z.number().max(300).optional(),
  status: z.enum(['selected', 'assigned', 'eliminated']).optional(),
  sorting: z
    .array(
      z.object({
        id: z.enum(['name', 'gender', 'beltLevel', 'weight', 'createdAt']),
        desc: z.boolean(),
      })
    )
    .max(5)
    .optional()
    .default([]),
});

export type BulkAddAthletesDTO = z.infer<typeof BulkAddAthletesSchema>;
export type UpdateTournamentAthleteDTO = z.infer<
  typeof UpdateTournamentAthleteSchema
>;
export type ListTournamentAthletesDTO = z.infer<
  typeof ListTournamentAthletesSchema
>;
