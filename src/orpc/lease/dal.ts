import { publishLeaseEvent } from './lease-stream';
import { resolveGroupLeaseStatus } from './lease-status';
import type {
  AcquireLeaseDTO,
  HeartbeatLeaseDTO,
  ListLeasesForTournamentDTO,
  ReleaseLeaseDTO,
  RequestTakeoverDTO,
  RespondTakeoverDTO,
} from './dto';
import type { Prisma } from '@prisma/client';
import { recordTournamentActivity } from '@/orpc/activity/dal';
import { prisma } from '@/lib/db';

type TakeoverMutationDatabase = Pick<
  typeof prisma,
  'leaseTakeoverRequest' | 'tournamentActivity'
>;

export class LeaseDAL {
  private static readonly LEASE_TTL_MS = 60_000;
  private static readonly TAKEOVER_REQUEST_TTL_MS = 30_000;

  private static getLeaseExpiry(now: Date) {
    return new Date(now.getTime() + LeaseDAL.LEASE_TTL_MS);
  }

  private static getTakeoverExpiryCutoff(now: Date) {
    return new Date(now.getTime() - LeaseDAL.TAKEOVER_REQUEST_TTL_MS);
  }

  private static isLeaseOwner(
    lease: { adminId: string; deviceId: string },
    input: { adminId: string; deviceId: string }
  ) {
    return lease.adminId === input.adminId && lease.deviceId === input.deviceId;
  }

  private static getRequesterTakeoverWhereUnique(input: {
    leaseId: string;
    requesterDeviceId: string;
    requesterAdminId: string;
  }) {
    return {
      leaseId_requesterDeviceId_requesterAdminId: input,
    };
  }

  private static isUniqueConstraintError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }

  private static isReopenableTakeoverStatus(status: string) {
    return status === 'denied' || status === 'expired';
  }

  private static throwAcquireConflict(
    existingLease: { deviceId: string },
    input: { deviceId: string }
  ): never {
    if (existingLease.deviceId === input.deviceId) {
      throw new Error('Group is already controlled by this device');
    }

    throw new Error('Group is currently controlled by another device');
  }

  private static async recordTakeoverRequestActivity(
    input: {
      tournamentId: string;
      groupId: string;
      leaseId: string;
      requestId: string;
      adminId: string;
      requesterDeviceId: string;
    },
    db: Parameters<typeof recordTournamentActivity>[1] = prisma
  ) {
    await recordTournamentActivity(
      {
        tournamentId: input.tournamentId,
        adminId: input.adminId,
        eventType: 'lease.takeover_request',
        entityType: 'group',
        entityId: input.groupId,
        payload: {
          leaseId: input.leaseId,
          requestId: input.requestId,
          requesterDeviceId: input.requesterDeviceId,
        },
      },
      db
    );
  }

  private static async createTakeoverRequest(
    input: {
      tournamentId: string;
      groupId: string;
      leaseId: string;
      adminId: string;
      requesterDeviceId: string;
      now: Date;
    },
    db: TakeoverMutationDatabase = prisma
  ) {
    const createdRequest = await db.leaseTakeoverRequest.create({
      data: {
        leaseId: input.leaseId,
        requesterDeviceId: input.requesterDeviceId,
        requesterAdminId: input.adminId,
        createdAt: input.now,
        status: 'pending',
      },
    });

    await LeaseDAL.recordTakeoverRequestActivity(
      {
        tournamentId: input.tournamentId,
        groupId: input.groupId,
        leaseId: input.leaseId,
        requestId: createdRequest.id,
        adminId: input.adminId,
        requesterDeviceId: input.requesterDeviceId,
      },
      db
    );

    return createdRequest;
  }

  private static async reopenTakeoverRequest(input: {
    requestId: string;
    tournamentId: string;
    groupId: string;
    leaseId: string;
    adminId: string;
    requesterDeviceId: string;
    requesterWhere: Prisma.LeaseTakeoverRequestWhereUniqueInput;
    now: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      const reopened = await tx.leaseTakeoverRequest.updateMany({
        where: {
          id: input.requestId,
          status: {
            not: 'pending',
          },
        },
        data: {
          status: 'pending',
          createdAt: input.now,
        },
      });

      const current = await tx.leaseTakeoverRequest.findUnique({
        where: input.requesterWhere,
      });

      if (!current) {
        throw new Error('Takeover request not found');
      }

      if (reopened.count > 0) {
        await LeaseDAL.recordTakeoverRequestActivity(
          {
            tournamentId: input.tournamentId,
            groupId: input.groupId,
            leaseId: input.leaseId,
            requestId: current.id,
            adminId: input.adminId,
            requesterDeviceId: input.requesterDeviceId,
          },
          tx
        );

        return current;
      }

      if (current.status === 'pending' || current.status === 'approved') {
        return current;
      }

      throw new Error('Takeover request could not be reopened');
    });
  }

  private static async replaceApprovedTakeoverRequest(input: {
    requestId: string;
    tournamentId: string;
    groupId: string;
    leaseId: string;
    adminId: string;
    requesterDeviceId: string;
    now: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.leaseTakeoverRequest.delete({
        where: { id: input.requestId },
      });

      return LeaseDAL.createTakeoverRequest(
        {
          tournamentId: input.tournamentId,
          groupId: input.groupId,
          leaseId: input.leaseId,
          adminId: input.adminId,
          requesterDeviceId: input.requesterDeviceId,
          now: input.now,
        },
        tx
      );
    });
  }

  private static async cleanupLeaseState(now: Date) {
    const expiredLeases = await prisma.groupControlLease.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
      select: {
        id: true,
        tournamentId: true,
      },
    });
    const affectedTournamentIds = new Set(
      expiredLeases.map((lease) => lease.tournamentId)
    );

    const expiredLeaseIds = expiredLeases.map((lease) => lease.id);

    if (expiredLeaseIds.length > 0) {
      await prisma.leaseTakeoverRequest.updateMany({
        where: {
          leaseId: {
            in: expiredLeaseIds,
          },
          status: 'pending',
        },
        data: {
          status: 'expired',
        },
      });

      await prisma.groupControlLease.deleteMany({
        where: {
          id: {
            in: expiredLeaseIds,
          },
        },
      });
    }

    const expiredTakeoverRequests = await prisma.leaseTakeoverRequest.findMany({
      where: {
        status: 'pending',
        createdAt: {
          lte: LeaseDAL.getTakeoverExpiryCutoff(now),
        },
      },
      select: {
        lease: {
          select: {
            tournamentId: true,
          },
        },
      },
    });

    for (const request of expiredTakeoverRequests) {
      affectedTournamentIds.add(request.lease.tournamentId);
    }

    await prisma.leaseTakeoverRequest.updateMany({
      where: {
        status: 'pending',
        createdAt: {
          lte: LeaseDAL.getTakeoverExpiryCutoff(now),
        },
      },
      data: {
        status: 'expired',
      },
    });

    for (const tournamentId of affectedTournamentIds) {
      LeaseDAL.notifyLeaseTournamentUpdated(tournamentId);
    }
  }

  private static async requireGroup(groupId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        tournamentId: true,
      },
    });

    if (!group) {
      throw new Error('Group not found');
    }

    return group;
  }

  private static async findLeaseByGroupId(groupId: string) {
    return prisma.groupControlLease.findUnique({
      where: { groupId },
    });
  }

  private static notifyLeaseTournamentUpdated(tournamentId: string) {
    publishLeaseEvent({
      type: 'invalidate',
      tournamentId,
    });
  }

  static async acquire(input: AcquireLeaseDTO & { adminId: string }) {
    const now = new Date();
    await LeaseDAL.cleanupLeaseState(now);

    const group = await LeaseDAL.requireGroup(input.groupId);
    const existingLease = await LeaseDAL.findLeaseByGroupId(input.groupId);

    if (existingLease) {
      LeaseDAL.throwAcquireConflict(existingLease, input);
    }

    try {
      const lease = await prisma.$transaction(async (tx) => {
        const lease = await tx.groupControlLease.create({
          data: {
            groupId: input.groupId,
            tournamentId: group.tournamentId,
            adminId: input.adminId,
            deviceId: input.deviceId,
            acquiredAt: now,
            lastHeartbeatAt: now,
            expiresAt: LeaseDAL.getLeaseExpiry(now),
          },
        });

        await recordTournamentActivity(
          {
            tournamentId: group.tournamentId,
            adminId: input.adminId,
            eventType: 'lease.acquire',
            entityType: 'group',
            entityId: input.groupId,
            payload: {
              leaseId: lease.id,
              deviceId: input.deviceId,
            },
          },
          tx
        );

        return lease;
      });

      LeaseDAL.notifyLeaseTournamentUpdated(lease.tournamentId);
      return lease;
    } catch (error) {
      if (!LeaseDAL.isUniqueConstraintError(error)) {
        throw error;
      }

      const currentLease = await LeaseDAL.findLeaseByGroupId(input.groupId);

      if (currentLease) {
        LeaseDAL.throwAcquireConflict(currentLease, input);
      }

      throw error;
    }
  }

  static async heartbeat(input: HeartbeatLeaseDTO & { adminId: string }) {
    const now = new Date();
    await LeaseDAL.cleanupLeaseState(now);

    const lease = await LeaseDAL.findLeaseByGroupId(input.groupId);

    if (!lease || !LeaseDAL.isLeaseOwner(lease, input)) {
      throw new Error('Lease is not held by this admin/device');
    }

    const updatedLease = await prisma.groupControlLease.update({
      where: { id: lease.id },
      data: {
        lastHeartbeatAt: now,
        expiresAt: LeaseDAL.getLeaseExpiry(now),
      },
    });

    LeaseDAL.notifyLeaseTournamentUpdated(updatedLease.tournamentId);
    return updatedLease;
  }

  static async release(input: ReleaseLeaseDTO & { adminId: string }) {
    const now = new Date();
    await LeaseDAL.cleanupLeaseState(now);

    const lease = await LeaseDAL.findLeaseByGroupId(input.groupId);

    if (!lease || !LeaseDAL.isLeaseOwner(lease, input)) {
      throw new Error('Lease is not held by this admin/device');
    }

    const deletedLease = await prisma.$transaction(async (tx) => {
      await tx.leaseTakeoverRequest.updateMany({
        where: {
          leaseId: lease.id,
          status: 'pending',
        },
        data: {
          status: 'expired',
        },
      });

      const deletedLease = await tx.groupControlLease.delete({
        where: { id: lease.id },
      });

      await recordTournamentActivity(
        {
          tournamentId: lease.tournamentId,
          adminId: input.adminId,
          eventType: 'lease.release',
          entityType: 'group',
          entityId: lease.groupId,
          payload: {
            leaseId: lease.id,
            deviceId: input.deviceId,
          },
        },
        tx
      );

      return deletedLease;
    });

    LeaseDAL.notifyLeaseTournamentUpdated(deletedLease.tournamentId);
    return deletedLease;
  }

  static async requestTakeover(
    input: RequestTakeoverDTO & { adminId: string }
  ) {
    const now = new Date();
    await LeaseDAL.cleanupLeaseState(now);

    const lease = await LeaseDAL.findLeaseByGroupId(input.groupId);

    if (!lease || lease.deviceId === input.deviceId) {
      throw new Error('Takeover requires another active lease holder');
    }

    const requesterWhere = LeaseDAL.getRequesterTakeoverWhereUnique({
      leaseId: lease.id,
      requesterDeviceId: input.deviceId,
      requesterAdminId: input.adminId,
    });
    const existingRequest = await prisma.leaseTakeoverRequest.findUnique({
      where: requesterWhere,
    });

    if (!existingRequest || existingRequest.status === 'pending') {
      if (existingRequest) {
        return existingRequest;
      }
    } else if (existingRequest.status === 'approved') {
      const replacementRequest = await LeaseDAL.replaceApprovedTakeoverRequest({
        requestId: existingRequest.id,
        tournamentId: lease.tournamentId,
        groupId: lease.groupId,
        leaseId: lease.id,
        adminId: input.adminId,
        requesterDeviceId: input.deviceId,
        now,
      });

      LeaseDAL.notifyLeaseTournamentUpdated(lease.tournamentId);
      return replacementRequest;
    } else if (!LeaseDAL.isReopenableTakeoverStatus(existingRequest.status)) {
      return existingRequest;
    }

    if (existingRequest) {
      const reopenedRequest = await LeaseDAL.reopenTakeoverRequest({
        requestId: existingRequest.id,
        tournamentId: lease.tournamentId,
        groupId: lease.groupId,
        leaseId: lease.id,
        adminId: input.adminId,
        requesterDeviceId: input.deviceId,
        requesterWhere,
        now,
      });

      LeaseDAL.notifyLeaseTournamentUpdated(lease.tournamentId);
      return reopenedRequest;
    }

    try {
      const request = await prisma.$transaction(async (tx) => {
        return LeaseDAL.createTakeoverRequest(
          {
            tournamentId: lease.tournamentId,
            groupId: lease.groupId,
            leaseId: lease.id,
            adminId: input.adminId,
            requesterDeviceId: input.deviceId,
            now,
          },
          tx
        );
      });

      LeaseDAL.notifyLeaseTournamentUpdated(lease.tournamentId);
      return request;
    } catch (error) {
      if (!LeaseDAL.isUniqueConstraintError(error)) {
        throw error;
      }

      const concurrentRequest = await prisma.leaseTakeoverRequest.findUnique({
        where: requesterWhere,
      });

      if (!concurrentRequest) {
        throw error;
      }

      if (concurrentRequest.status === 'pending') {
        return concurrentRequest;
      }

      if (concurrentRequest.status === 'approved') {
        const replacementRequest =
          await LeaseDAL.replaceApprovedTakeoverRequest({
            requestId: concurrentRequest.id,
            tournamentId: lease.tournamentId,
            groupId: lease.groupId,
            leaseId: lease.id,
            adminId: input.adminId,
            requesterDeviceId: input.deviceId,
            now,
          });

        LeaseDAL.notifyLeaseTournamentUpdated(lease.tournamentId);
        return replacementRequest;
      }

      if (!LeaseDAL.isReopenableTakeoverStatus(concurrentRequest.status)) {
        return concurrentRequest;
      }

      const reopenedRequest = await LeaseDAL.reopenTakeoverRequest({
        requestId: concurrentRequest.id,
        tournamentId: lease.tournamentId,
        groupId: lease.groupId,
        leaseId: lease.id,
        adminId: input.adminId,
        requesterDeviceId: input.deviceId,
        requesterWhere,
        now,
      });

      LeaseDAL.notifyLeaseTournamentUpdated(lease.tournamentId);
      return reopenedRequest;
    }
  }

  static async respondTakeover(
    input: RespondTakeoverDTO & { adminId: string }
  ) {
    const now = new Date();
    await LeaseDAL.cleanupLeaseState(now);

    const response = await prisma.$transaction(async (tx) => {
      const request = await tx.leaseTakeoverRequest.findUnique({
        where: { id: input.requestId },
        include: {
          lease: true,
        },
      });

      if (!request?.lease) {
        throw new Error('Takeover request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Takeover request is no longer pending');
      }

      if (!LeaseDAL.isLeaseOwner(request.lease, input)) {
        throw new Error('Only the current lease holder can respond');
      }

      if (!input.approve) {
        const deniedRequest = await tx.leaseTakeoverRequest.update({
          where: { id: request.id },
          data: {
            status: 'denied',
          },
        });

        await recordTournamentActivity(
          {
            tournamentId: request.lease.tournamentId,
            adminId: input.adminId,
            eventType: 'lease.takeover_deny',
            entityType: 'group',
            entityId: request.lease.groupId,
            payload: {
              leaseId: request.leaseId,
              requestId: request.id,
              requesterDeviceId: request.requesterDeviceId,
            },
          },
          tx
        );

        return {
          result: deniedRequest,
          tournamentId: request.lease.tournamentId,
        };
      }

      const transferredLease = await tx.groupControlLease.update({
        where: { id: request.leaseId },
        data: {
          adminId: request.requesterAdminId,
          deviceId: request.requesterDeviceId,
          acquiredAt: now,
          lastHeartbeatAt: now,
          expiresAt: LeaseDAL.getLeaseExpiry(now),
        },
      });

      await tx.leaseTakeoverRequest.update({
        where: { id: request.id },
        data: {
          status: 'approved',
        },
      });

      await tx.leaseTakeoverRequest.updateMany({
        where: {
          leaseId: request.leaseId,
          id: {
            not: request.id,
          },
          status: 'pending',
        },
        data: {
          status: 'expired',
        },
      });

      await recordTournamentActivity(
        {
          tournamentId: request.lease.tournamentId,
          adminId: input.adminId,
          eventType: 'lease.takeover_approve',
          entityType: 'group',
          entityId: request.lease.groupId,
          payload: {
            leaseId: request.leaseId,
            requestId: request.id,
            requesterDeviceId: request.requesterDeviceId,
            previousDeviceId: request.lease.deviceId,
          },
        },
        tx
      );

      return {
        result: transferredLease,
        tournamentId: request.lease.tournamentId,
      };
    });

    LeaseDAL.notifyLeaseTournamentUpdated(response.tournamentId);
    return response.result;
  }

  /** Expire stale leases / takeover rows before read-heavy views. */
  static async prepareLeaseReadSnapshot() {
    await LeaseDAL.cleanupLeaseState(new Date());
  }

  static async listForTournament(input: ListLeasesForTournamentDTO) {
    const now = new Date();
    await LeaseDAL.cleanupLeaseState(now);

    const leases = await prisma.groupControlLease.findMany({
      where: {
        tournamentId: input.tournamentId,
      },
      orderBy: {
        acquiredAt: 'asc',
      },
      include: {
        takeoverRequests: {
          where: {
            status: 'pending',
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return leases.map((lease) => ({
      id: lease.id,
      groupId: lease.groupId,
      tournamentId: lease.tournamentId,
      acquiredAt: lease.acquiredAt,
      lastHeartbeatAt: lease.lastHeartbeatAt,
      expiresAt: lease.expiresAt,
      leaseStatus: resolveGroupLeaseStatus(input.deviceId, lease),
      takeoverRequests: lease.takeoverRequests.map((request) => ({
        id: request.id,
        requesterAdminId: request.requesterAdminId,
        createdAt: request.createdAt,
        status: request.status,
      })),
    }));
  }
}
