import { AdvanceSettingsDAL } from './dal';
import { SelectionCatalogSchema, SelectionMatchesSchema } from './dto';
import { authedProcedure } from '@/orpc/middleware';

export const selectionCatalog = authedProcedure
  .input(SelectionCatalogSchema)
  .handler(async ({ input }) => AdvanceSettingsDAL.selectionCatalog(input));

export const selectionMatches = authedProcedure
  .input(SelectionMatchesSchema)
  .handler(async ({ input }) => AdvanceSettingsDAL.selectionMatches(input));
