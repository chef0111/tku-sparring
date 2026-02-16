import { z } from 'zod';

export const AthleteSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  beltLevel: z.string(),
  weight: z.number(),
  affiliation: z.string(),
  order: z.number(),
  groupId: z.string().nullable(),
  tournamentId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateAthleteSchema = z.object({
  code: z.string().min(1, 'Athlete code is required'),
  name: z.string().min(1, 'Athlete name is required'),
  beltLevel: z.string().min(1, 'Belt level is required'),
  weight: z.number().positive('Weight must be positive'),
  affiliation: z.string().min(1, 'Affiliation is required'),
});

export const UpdateAthleteSchema = z.object({
  id: z.string(),
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  beltLevel: z.string().min(1).optional(),
  weight: z.number().positive().optional(),
  affiliation: z.string().min(1).optional(),
});

export const CreateAthletesSchema = z.object({
  athletes: z
    .array(CreateAthleteSchema)
    .min(1, 'At least one athlete is required'),
});

export const DeleteAthletesSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID is required'),
});

export const ReorderAthletesSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID is required'),
});

export type AthleteDTO = z.infer<typeof AthleteSchema>;
export type CreateAthleteDTO = z.infer<typeof CreateAthleteSchema>;
export type UpdateAthleteDTO = z.infer<typeof UpdateAthleteSchema>;
export type CreateAthletesDTO = z.infer<typeof CreateAthletesSchema>;
export type DeleteAthletesDTO = z.infer<typeof DeleteAthletesSchema>;
export type ReorderAthletesDTO = z.infer<typeof ReorderAthletesSchema>;
