import { z } from 'zod';

export const GroupConstraintsSchema = z.object({
  gender: z.enum(['M', 'F']).nullable().optional(),
  beltMin: z.number().int().min(0).max(10).nullable().optional(),
  beltMax: z.number().int().min(0).max(10).nullable().optional(),
  weightMin: z.number().min(20).max(150).nullable().optional(),
  weightMax: z.number().min(20).max(150).nullable().optional(),
});

export const GroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  tournamentId: z.string(),
  gender: z.string().nullable(),
  beltMin: z.number().nullable(),
  beltMax: z.number().nullable(),
  weightMin: z.number().nullable(),
  weightMax: z.number().nullable(),
  thirdPlaceMatch: z.boolean(),
  arenaIndex: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  tournamentId: z.string(),
});

export const UpdateGroupSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1, 'Group name is required').optional(),
    thirdPlaceMatch: z.boolean().optional(),
    arenaIndex: z.number().int().min(1).optional(),
  })
  .merge(GroupConstraintsSchema);

export const AutoAssignSchema = z.object({
  tournamentId: z.string(),
  groupId: z.string(),
});

export const AssignAthleteSchema = z.object({
  groupId: z.string(),
  tournamentAthleteId: z.string(),
});

export const UnassignAthleteSchema = z.object({
  tournamentAthleteId: z.string(),
});

export type GroupDTO = z.infer<typeof GroupSchema>;
export type CreateGroupDTO = z.infer<typeof CreateGroupSchema>;
export type UpdateGroupDTO = z.infer<typeof UpdateGroupSchema>;
export type AutoAssignDTO = z.infer<typeof AutoAssignSchema>;
export type AssignAthleteDTO = z.infer<typeof AssignAthleteSchema>;
export type UnassignAthleteDTO = z.infer<typeof UnassignAthleteSchema>;
