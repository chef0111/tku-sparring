import { z } from 'zod';

export const TournamentStatusSchema = z.enum(['draft', 'active', 'completed']);
export const TournamentSortFieldSchema = z.enum([
  'name',
  'status',
  'athletes',
  'createdAt',
]);

export const TournamentSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: TournamentStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateTournamentSchema = z.object({
  name: z.string().min(1, 'Tournament name is required'),
});

export const UpdateTournamentSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tournament name is required'),
});

export const SetTournamentStatusSchema = z.object({
  id: z.string(),
  status: TournamentStatusSchema,
});

export const ListTournamentsSchema = z.object({
  page: z.number().int().positive().optional(),
  perPage: z.number().int().positive().optional(),
  query: z.string().optional(),
  name: z.string().optional(),
  status: z.array(TournamentStatusSchema).optional(),
  sort: TournamentSortFieldSchema.optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

export type TournamentStatusDTO = z.infer<typeof TournamentStatusSchema>;
export type TournamentDTO = z.infer<typeof TournamentSchema>;
export type CreateTournamentDTO = z.infer<typeof CreateTournamentSchema>;
export type UpdateTournamentDTO = z.infer<typeof UpdateTournamentSchema>;
export type SetTournamentStatusDTO = z.infer<typeof SetTournamentStatusSchema>;
export type ListTournamentsDTO = z.infer<typeof ListTournamentsSchema>;
