import { ListTournamentActivitySchema } from './dto';
import { listTournamentActivity } from './dal';
import { authedProcedure } from '@/orpc/middleware';

export const listForTournament = authedProcedure
  .input(ListTournamentActivitySchema)
  .handler(async ({ input }) => {
    return listTournamentActivity(input);
  });
