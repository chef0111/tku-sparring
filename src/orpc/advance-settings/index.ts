import { AdvanceSettingsDAL } from './dal';
import { SelectionCatalogSchema, SelectionMatchesSchema } from './dto';
import { authorized } from '@/orpc/middleware';

export const selectionCatalog = authorized
  .input(SelectionCatalogSchema)
  .handler(async ({ input }) => AdvanceSettingsDAL.selectionCatalog(input));

export const selectionMatches = authorized
  .input(SelectionMatchesSchema)
  .handler(async ({ input }) => AdvanceSettingsDAL.selectionMatches(input));
