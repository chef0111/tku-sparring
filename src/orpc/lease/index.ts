import { LeaseDAL } from './dal';
import {
  AcquireLeaseSchema,
  HeartbeatLeaseSchema,
  ListLeasesForTournamentSchema,
  ReleaseLeaseSchema,
  RequestTakeoverSchema,
  RespondTakeoverSchema,
} from './dto';
import { authedProcedure } from '@/orpc/middleware';

export const acquire = authedProcedure
  .input(AcquireLeaseSchema)
  .handler(async ({ context, input }) => {
    const lease = await LeaseDAL.acquire({
      ...input,
      adminId: context.user.id,
    });
    return lease;
  });

export const heartbeat = authedProcedure
  .input(HeartbeatLeaseSchema)
  .handler(async ({ context, input }) => {
    const lease = await LeaseDAL.heartbeat({
      ...input,
      adminId: context.user.id,
    });
    return lease;
  });

export const release = authedProcedure
  .input(ReleaseLeaseSchema)
  .handler(async ({ context, input }) => {
    const lease = await LeaseDAL.release({
      ...input,
      adminId: context.user.id,
    });
    return lease;
  });

export const requestTakeover = authedProcedure
  .input(RequestTakeoverSchema)
  .handler(async ({ context, input }) => {
    const request = await LeaseDAL.requestTakeover({
      ...input,
      adminId: context.user.id,
    });
    return request;
  });

export const respondTakeover = authedProcedure
  .input(RespondTakeoverSchema)
  .handler(async ({ context, input }) => {
    const response = await LeaseDAL.respondTakeover({
      ...input,
      adminId: context.user.id,
    });
    return response;
  });

export const listForTournamentLeases = authedProcedure
  .input(ListLeasesForTournamentSchema)
  .handler(async ({ input }) => {
    const leases = await LeaseDAL.listForTournament(input);
    return leases;
  });
