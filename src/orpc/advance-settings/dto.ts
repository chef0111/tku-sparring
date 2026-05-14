import { z } from 'zod';

/** Tournaments list + groups for one tournament (key excludes `groupId`). */
export const SelectionCatalogSchema = z.object({
  deviceId: z.string().min(1),
  tournamentId: z.string().nullish(),
});

export type SelectionCatalogDTO = z.infer<typeof SelectionCatalogSchema>;

/** Pending matches for one group (key includes `groupId`). */
export const SelectionMatchesSchema = z.object({
  deviceId: z.string().min(1),
  tournamentId: z.string().min(1),
  groupId: z.string().min(1),
});

export type SelectionMatchesDTO = z.infer<typeof SelectionMatchesSchema>;
