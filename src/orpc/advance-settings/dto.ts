import { z } from 'zod';

export const SelectionViewSchema = z.object({
  deviceId: z.string().min(1),
  tournamentId: z.string().optional(),
  groupId: z.string().optional(),
});

export type SelectionViewDTO = z.infer<typeof SelectionViewSchema>;
