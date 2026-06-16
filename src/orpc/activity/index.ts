import { ListTournamentActivitySchema } from './dto';
import { listTournamentActivity } from './dal';
import { authorized } from '@/orpc/middleware';

export const listForTournament = authorized
  .input(ListTournamentActivitySchema)
  .handler(async ({ input }) => {
    return listTournamentActivity(input);
  });
