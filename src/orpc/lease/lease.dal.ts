import { publishLeaseEvent } from './lease-stream';
import type {
  AcquireLeaseDTO,
  HeartbeatLeaseDTO,
  ListLeasesForTournamentDTO,
  ReleaseLeaseDTO,
  RequestTakeoverDTO,
  RespondTakeoverDTO,
} from './lease.dto';
import { recordTournamentActivity } from '@/orpc/activity/tournament-activity.dal';
import { prisma } from '@/lib/db';

const LEASE_TTL_MS = 60_000;
const TAKEOVER_REQUEST_TTL_MS = 30_000;

function getLeaseExpiry(now: Date) {
  return new Date(now.getTime() + LEASE_TTL_MS);
}

function getTakeoverExpiryCutoff(now: Date) {
  return new Date(now.getTime() - TAKEOVER_REQUEST_TTL_MS);
}

function isLeaseOwner(
  lease: { adminId: string; deviceId: string },
  input: { adminId: string; deviceId: string }
) {
  return lease.adminId === input.adminId && lease.deviceId === input.deviceId;
}

function getRequesterTakeoverWhereUnique(input: {
  leaseId: string;
  requesterDeviceId: string;
  requesterAdminId: string;
}) {
  return {
    leaseId_requesterDeviceId_requesterAdminId: input,
  };
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

function isReopenableTakeoverStatus(status: string) {
  return status === 'denied' || status === 'expired';
}

function throwAcquireConflict(
  existingLease: { deviceId: string },
  input: { deviceId: string }
): never {
  if (existingLease.deviceId === input.deviceId) {
    throw new Error('Group is already controlled by this device');
  }

  throw new Error('Group is currently controlled by another device');
}

async function recordTakeoverRequestActivity(
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

type TakeoverMutationDatabase = Pick<
  typeof prisma,
  'leaseTakeoverRequest' | 'tournamentActivity'
>;

async function createTakeoverRequest(
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

  await recordTakeoverRequestActivity(
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

async function reopenTakeoverRequest(input: {
  requestId: string;
  tournamentId: string;
  groupId: string;
  leaseId: string;
  adminId: string;
  requesterDeviceId: string;
  requesterWhere: ReturnType<typeof getRequesterTakeoverWhereUnique>;
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
      await recordTakeoverRequestActivity(
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

async function replaceApprovedTakeoverRequest(input: {
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

    return createTakeoverRequest(
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

async function cleanupLeaseState(now: Date) {
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
        lte: getTakeoverExpiryCutoff(now),
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
        lte: getTakeoverExpiryCutoff(now),
      },
    },
    data: {
      status: 'expired',
    },
  });

  for (const tournamentId of affectedTournamentIds) {
    notifyLeaseTournamentUpdated(tournamentId);
  }
}

async function requireGroup(groupId: string) {
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

async function findLeaseByGroupId(groupId: string) {
  return prisma.groupControlLease.findUnique({
    where: { groupId },
  });
}

function notifyLeaseTournamentUpdated(tournamentId: string) {
  publishLeaseEvent({
    type: 'invalidate',
    tournamentId,
  });
}

export async function acquire(input: AcquireLeaseDTO & { adminId: string }) {
  const now = new Date();
  await cleanupLeaseState(now);

  const group = await requireGroup(input.groupId);
  const existingLease = await findLeaseByGroupId(input.groupId);

  if (existingLease) {
    throwAcquireConflict(existingLease, input);
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
          expiresAt: getLeaseExpiry(now),
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

    notifyLeaseTournamentUpdated(lease.tournamentId);
    return lease;
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const currentLease = await findLeaseByGroupId(input.groupId);

    if (currentLease) {
      throwAcquireConflict(currentLease, input);
    }

    throw error;
  }
}

export async function heartbeat(
  input: HeartbeatLeaseDTO & { adminId: string }
) {
  const now = new Date();
  await cleanupLeaseState(now);

  const lease = await findLeaseByGroupId(input.groupId);

  if (!lease || !isLeaseOwner(lease, input)) {
    throw new Error('Lease is not held by this admin/device');
  }

  const updatedLease = await prisma.groupControlLease.update({
    where: { id: lease.id },
    data: {
      lastHeartbeatAt: now,
      expiresAt: getLeaseExpiry(now),
    },
  });

  notifyLeaseTournamentUpdated(updatedLease.tournamentId);
  return updatedLease;
}

export async function release(input: ReleaseLeaseDTO & { adminId: string }) {
  const now = new Date();
  await cleanupLeaseState(now);

  const lease = await findLeaseByGroupId(input.groupId);

  if (!lease || !isLeaseOwner(lease, input)) {
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

  notifyLeaseTournamentUpdated(deletedLease.tournamentId);
  return deletedLease;
}

export async function requestTakeover(
  input: RequestTakeoverDTO & { adminId: string }
) {
  const now = new Date();
  await cleanupLeaseState(now);

  const lease = await findLeaseByGroupId(input.groupId);

  if (!lease || lease.deviceId === input.deviceId) {
    throw new Error('Takeover requires another active lease holder');
  }

  const requesterWhere = getRequesterTakeoverWhereUnique({
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
    const replacementRequest = await replaceApprovedTakeoverRequest({
      requestId: existingRequest.id,
      tournamentId: lease.tournamentId,
      groupId: lease.groupId,
      leaseId: lease.id,
      adminId: input.adminId,
      requesterDeviceId: input.deviceId,
      now,
    });

    notifyLeaseTournamentUpdated(lease.tournamentId);
    return replacementRequest;
  } else if (!isReopenableTakeoverStatus(existingRequest.status)) {
    return existingRequest;
  }

  if (existingRequest) {
    const reopenedRequest = await reopenTakeoverRequest({
      requestId: existingRequest.id,
      tournamentId: lease.tournamentId,
      groupId: lease.groupId,
      leaseId: lease.id,
      adminId: input.adminId,
      requesterDeviceId: input.deviceId,
      requesterWhere,
      now,
    });

    notifyLeaseTournamentUpdated(lease.tournamentId);
    return reopenedRequest;
  }

  try {
    const request = await prisma.$transaction(async (tx) => {
      return createTakeoverRequest(
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

    notifyLeaseTournamentUpdated(lease.tournamentId);
    return request;
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
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
      const replacementRequest = await replaceApprovedTakeoverRequest({
        requestId: concurrentRequest.id,
        tournamentId: lease.tournamentId,
        groupId: lease.groupId,
        leaseId: lease.id,
        adminId: input.adminId,
        requesterDeviceId: input.deviceId,
        now,
      });

      notifyLeaseTournamentUpdated(lease.tournamentId);
      return replacementRequest;
    }

    if (!isReopenableTakeoverStatus(concurrentRequest.status)) {
      return concurrentRequest;
    }

    const reopenedRequest = await reopenTakeoverRequest({
      requestId: concurrentRequest.id,
      tournamentId: lease.tournamentId,
      groupId: lease.groupId,
      leaseId: lease.id,
      adminId: input.adminId,
      requesterDeviceId: input.deviceId,
      requesterWhere,
      now,
    });

    notifyLeaseTournamentUpdated(lease.tournamentId);
    return reopenedRequest;
  }
}

export async function respondTakeover(
  input: RespondTakeoverDTO & { adminId: string }
) {
  const now = new Date();
  await cleanupLeaseState(now);

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

    if (!isLeaseOwner(request.lease, input)) {
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
        expiresAt: getLeaseExpiry(now),
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

  notifyLeaseTournamentUpdated(response.tournamentId);
  return response.result;
}

function toLeaseStatus(
  deviceId: string | undefined,
  lease: {
    deviceId: string;
    takeoverRequests: Array<{ requesterDeviceId: string }>;
  }
) {
  if (deviceId && lease.deviceId === deviceId) {
    return 'held_by_me' as const;
  }

  if (
    deviceId &&
    lease.takeoverRequests.some(
      (request) => request.requesterDeviceId === deviceId
    )
  ) {
    return 'pending_takeover' as const;
  }

  return 'held_by_other' as const;
}

export async function listForTournament(input: ListLeasesForTournamentDTO) {
  const now = new Date();
  await cleanupLeaseState(now);

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
    leaseStatus: toLeaseStatus(input.deviceId, lease),
    takeoverRequests: lease.takeoverRequests.map((request) => ({
      id: request.id,
      requesterAdminId: request.requesterAdminId,
      createdAt: request.createdAt,
      status: request.status,
    })),
  }));
}
