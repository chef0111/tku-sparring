import { SelectionCatalogSchema, SelectionMatchesSchema } from './dto';
import { authorized } from '@/orpc/middleware';
import { selectionCatalog as runSelectionCatalog } from '@/server/application/advance-settings/use-cases/selection-catalog';
import { selectionMatches as runSelectionMatches } from '@/server/application/advance-settings/use-cases/selection-matches';

export const selectionCatalog = authorized
  .input(SelectionCatalogSchema)
  .handler(async ({ input, context }) =>
    runSelectionCatalog(input, context.repos.advanceSelection)
  );

export const selectionMatches = authorized
  .input(SelectionMatchesSchema)
  .handler(async ({ input, context }) =>
    runSelectionMatches(input, context.repos.advanceSelection)
  );
