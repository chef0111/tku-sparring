import {
  acquire as acquireLease,
  requestTakeover as createTakeoverRequest,
  heartbeat as heartbeatLease,
  listForTournament,
  release as releaseLease,
  respondTakeover as respondTakeoverRequest,
} from './lease.dal';
import {
  AcquireLeaseSchema,
  HeartbeatLeaseSchema,
  ListLeasesForTournamentSchema,
  ReleaseLeaseSchema,
  RequestTakeoverSchema,
  RespondTakeoverSchema,
} from './lease.dto';
import { authedProcedure } from '@/orpc/middleware';

export const acquire = authedProcedure
  .input(AcquireLeaseSchema)
  .handler(async ({ context, input }) => {
    return acquireLease({
      ...input,
      adminId: context.user.id,
    });
  });

export const heartbeat = authedProcedure
  .input(HeartbeatLeaseSchema)
  .handler(async ({ context, input }) => {
    return heartbeatLease({
      ...input,
      adminId: context.user.id,
    });
  });

export const release = authedProcedure
  .input(ReleaseLeaseSchema)
  .handler(async ({ context, input }) => {
    return releaseLease({
      ...input,
      adminId: context.user.id,
    });
  });

export const requestTakeover = authedProcedure
  .input(RequestTakeoverSchema)
  .handler(async ({ context, input }) => {
    return createTakeoverRequest({
      ...input,
      adminId: context.user.id,
    });
  });

export const respondTakeover = authedProcedure
  .input(RespondTakeoverSchema)
  .handler(async ({ context, input }) => {
    return respondTakeoverRequest({
      ...input,
      adminId: context.user.id,
    });
  });

export const listForTournamentLeases = authedProcedure
  .input(ListLeasesForTournamentSchema)
  .handler(async ({ input }) => {
    return listForTournament(input);
  });
