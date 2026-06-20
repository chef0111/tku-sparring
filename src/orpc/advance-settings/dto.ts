import { z } from 'zod';

/** Tournaments list + divisions for one tournament (key excludes `divisionId`). */
export const SelectionCatalogSchema = z.object({
  deviceId: z.string().min(1),
  tournamentId: z.string().nullish(),
});

export type SelectionCatalogDTO = z.infer<typeof SelectionCatalogSchema>;

/** Pending matches for one division (key includes `divisionId`). */
export const SelectionMatchesSchema = z.object({
  deviceId: z.string().min(1),
  tournamentId: z.string().min(1),
  divisionId: z.string().min(1),
});

export type SelectionMatchesDTO = z.infer<typeof SelectionMatchesSchema>;
