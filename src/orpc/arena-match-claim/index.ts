import { ArenaMatchClaimDAL } from './dal';
import { ClaimMatchSchema, ReleaseMatchClaimSchema } from './dto';
import { authedProcedure } from '@/orpc/middleware';
import { assertSystemAdmin } from '@/orpc/policies/auth';

export const claim = authedProcedure
  .input(ClaimMatchSchema)
  .handler(async ({ context, input }) => {
    assertSystemAdmin(context.user);
    return ArenaMatchClaimDAL.claim({
      matchId: input.matchId,
      groupId: input.groupId,
      tournamentId: input.tournamentId,
      deviceId: input.deviceId,
      userId: context.user.id,
    });
  });

export const release = authedProcedure
  .input(ReleaseMatchClaimSchema)
  .handler(async ({ context, input }) => {
    assertSystemAdmin(context.user);
    return ArenaMatchClaimDAL.release({
      matchId: input.matchId,
      deviceId: input.deviceId,
      userId: context.user.id,
    });
  });
