import { ArenaMatchClaimDAL } from './dal';
import {
  ClaimMatchSchema,
  MatchClaimHeartbeatSchema,
  ReleaseMatchClaimSchema,
} from './dto';
import { authedProcedure } from '@/orpc/middleware';

export const claim = authedProcedure
  .input(ClaimMatchSchema)
  .handler(async ({ context, input }) => {
    return ArenaMatchClaimDAL.claim({
      matchId: input.matchId,
      groupId: input.groupId,
      tournamentId: input.tournamentId,
      deviceId: input.deviceId,
      userId: context.user.id,
    });
  });

export const heartbeat = authedProcedure
  .input(MatchClaimHeartbeatSchema)
  .handler(async ({ context, input }) => {
    return ArenaMatchClaimDAL.heartbeat({
      matchId: input.matchId,
      deviceId: input.deviceId,
      userId: context.user.id,
    });
  });

export const release = authedProcedure
  .input(ReleaseMatchClaimSchema)
  .handler(async ({ context, input }) => {
    return ArenaMatchClaimDAL.release({
      matchId: input.matchId,
      deviceId: input.deviceId,
      userId: context.user.id,
    });
  });
