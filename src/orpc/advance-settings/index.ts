import { AdvanceSettingsDAL } from './dal';
import { SelectionViewSchema } from './dto';
import { authedProcedure } from '@/orpc/middleware';

export const selectionView = authedProcedure
  .input(SelectionViewSchema)
  .handler(async ({ input }) => AdvanceSettingsDAL.selectionView(input));
