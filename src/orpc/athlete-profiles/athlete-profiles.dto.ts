import { z } from 'zod';

export const CreateAthleteProfileSchema = z.object({
  athleteCode: z.string().min(1, 'Athlete ID is required'),
  name: z.string().min(1, 'Name is required'),
  gender: z.enum(['M', 'F']),
  beltLevel: z.number().int().min(0).max(10),
  weight: z
    .number()
    .min(20, 'Weight must be at least 20 kg')
    .max(150, 'Weight must be at most 150 kg'),
  affiliation: z.string().min(1, 'Affiliation is required'),
  confirmDuplicate: z.boolean().optional().default(false),
});

export const UpdateAthleteProfileSchema = z.object({
  id: z.string(),
  athleteCode: z.string().min(1, 'Athlete ID is required'),
  name: z.string().min(1).optional(),
  gender: z.enum(['M', 'F']).optional(),
  beltLevel: z.number().int().min(0).max(10).optional(),
  weight: z.number().min(20).max(150).optional(),
  affiliation: z.string().min(1).optional(),
});

export const AthleteProfilesSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  perPage: z.number().int().min(1).max(100).optional().default(20),
  name: z.string().optional(),
  athleteCode: z.string().optional(),
  gender: z.enum(['M', 'F']).optional(),
  affiliation: z.string().optional(),
  beltLevelMin: z.number().int().min(0).max(10).optional(),
  beltLevelMax: z.number().int().min(0).max(10).optional(),
  weightMin: z.number().min(0).optional(),
  weightMax: z.number().max(200).optional(),
  sort: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const CheckDuplicateSchema = z.object({
  athleteCode: z.string(),
  name: z.string(),
  gender: z.enum(['M', 'F']),
  beltLevel: z.number().int().min(0).max(10),
  weight: z.number(),
  affiliation: z.string(),
  excludeId: z.string().optional(),
});

export type CreateAthleteProfileDTO = z.infer<
  typeof CreateAthleteProfileSchema
>;
export type UpdateAthleteProfileDTO = z.infer<
  typeof UpdateAthleteProfileSchema
>;
export type AthleteProfilesDTO = z.infer<typeof AthleteProfilesSchema>;
export type CheckDuplicateDTO = z.infer<typeof CheckDuplicateSchema>;

export const BulkDeleteAthleteProfilesSchema = z.object({
  ids: z.array(z.string()).min(1).max(200),
});

export type BulkDeleteAthleteProfilesDTO = z.infer<
  typeof BulkDeleteAthleteProfilesSchema
>;
