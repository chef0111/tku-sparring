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

export const SetArenaGroupOrderSchema = z.object({
  tournamentId: z.string(),
  arenaIndex: z.number().int().min(1),
  groupIds: z.array(z.string()),
});

export const MoveGroupArenaSchema = z.object({
  tournamentId: z.string(),
  groupId: z.string(),
  fromArena: z.number().int().min(1),
  toArena: z.number().int().min(1),
  insertIndex: z.number().int().min(0),
});

export const EnsureArenaSlotSchema = z.object({
  tournamentId: z.string(),
  arenaIndex: z.number().int().min(1).max(3),
});

export const RetireArenaSchema = z.object({
  tournamentId: z.string(),
  fromArena: z.number().int().min(1).max(3),
  toArena: z.number().int().min(1).max(3),
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
export type SetArenaGroupOrderDTO = z.infer<typeof SetArenaGroupOrderSchema>;
export type MoveGroupArenaDTO = z.infer<typeof MoveGroupArenaSchema>;
export type EnsureArenaSlotDTO = z.infer<typeof EnsureArenaSlotSchema>;
export type RetireArenaDTO = z.infer<typeof RetireArenaSchema>;
export type ListTournamentsDTO = z.infer<typeof ListTournamentsSchema>;
