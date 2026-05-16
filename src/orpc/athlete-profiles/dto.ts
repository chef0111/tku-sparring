import { z } from 'zod';
import { dataTableConfig } from '@/config/data-table';
import { filterItemSchema } from '@/lib/data-table/parsers';
import { flagConfig } from '@/config/flag';

const createProfileImageSchema = z
  .union([z.url('Photo URL must be a valid URL'), z.literal('')])
  .optional()
  .transform((v) => (v === undefined || v === '' ? undefined : v));

const updateProfileImageSchema = z
  .union([
    z.string().url('Photo URL must be a valid URL'),
    z.literal(''),
    z.null(),
  ])
  .optional()
  .transform((v) =>
    v === undefined ? undefined : v === '' || v === null ? null : v
  );

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
  image: createProfileImageSchema,
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
  image: updateProfileImageSchema,
});

export const AthleteProfilesSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  perPage: z.number().int().min(1).max(100).optional().default(20),
  query: z.string().optional(),
  name: z.string().optional(),
  athleteCode: z.string().optional(),
  gender: z
    .array(z.enum(['M', 'F']))
    .min(1)
    .max(2)
    .optional(),
  affiliation: z.string().optional(),
  beltLevels: z
    .array(z.number().int().min(0).max(10))
    .min(1)
    .max(20)
    .optional(),
  beltLevelMin: z.number().int().min(0).max(10).optional(),
  beltLevelMax: z.number().int().min(0).max(10).optional(),
  weightMin: z.number().min(0).optional(),
  weightMax: z.number().max(200).optional(),
  sorting: z
    .array(
      z.object({
        id: z.enum(['name', 'beltLevel', 'weight', 'affiliation', 'createdAt']),
        desc: z.boolean(),
      })
    )
    .max(5)
    .optional()
    .default([]),
  filterFlag: z
    .enum(
      flagConfig.featureFlags.map((flag) => flag.value) as [
        'advancedFilters',
        'commandFilters',
      ]
    )
    .optional(),
  filters: z.array(filterItemSchema).optional().default([]),
  joinOperator: z.enum(dataTableConfig.joinOperators).optional().default('and'),
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
