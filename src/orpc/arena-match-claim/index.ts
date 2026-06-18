import { ClaimMatchSchema, ReleaseMatchClaimSchema } from './dto';
import { authorized } from '@/orpc/middleware';
import { assertSystemAdmin } from '@/orpc/policies/auth';
import { claimMatch as runClaimMatch } from '@/server/application/arena-match-claim/use-cases/claim';
import { releaseClaim as runReleaseClaim } from '@/server/application/arena-match-claim/use-cases/release';

export const claim = authorized
  .input(ClaimMatchSchema)
  .handler(async ({ context, input }) => {
    assertSystemAdmin(context.user);
    return runClaimMatch(
      {
        matchId: input.matchId,
        groupId: input.groupId,
        tournamentId: input.tournamentId,
        deviceId: input.deviceId,
        userId: context.user.id,
      },
      context.repos.arenaMatchClaim
    );
  });

export const release = authorized
  .input(ReleaseMatchClaimSchema)
  .handler(async ({ context, input }) => {
    assertSystemAdmin(context.user);
    return runReleaseClaim(
      {
        matchId: input.matchId,
        deviceId: input.deviceId,
        userId: context.user.id,
      },
      context.repos.arenaMatchClaim
    );
  });
