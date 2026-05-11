import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  acquire,
  heartbeat,
  listForTournament,
  release,
  requestTakeover,
  respondTakeover,
} from '../lease.dal';
import { publishLeaseEvent } from '../lease-stream';
import { prisma } from '@/lib/db';

vi.mock('../lease-stream', () => ({
  publishLeaseEvent: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn(),
    group: {
      findUnique: vi.fn(),
    },
    groupControlLease: {
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    leaseTakeoverRequest: {
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    tournamentActivity: {
      create: vi.fn(),
    },
  },
}));

const NOW = new Date('2026-05-01T10:00:00.000Z');

function uniqueConstraintError() {
  return Object.assign(new Error('Unique constraint failed'), {
    code: 'P2002',
  });
}

function activeLease(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lease-1',
    groupId: 'group-1',
    tournamentId: 'tournament-1',
    adminId: 'admin-holder',
    deviceId: 'device-holder',
    acquiredAt: NOW,
    lastHeartbeatAt: NOW,
    expiresAt: new Date('2026-05-01T10:01:00.000Z'),
    ...overrides,
  };
}

function pendingRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: 'request-1',
    leaseId: 'lease-1',
    requesterDeviceId: 'device-requester',
    requesterAdminId: 'admin-requester',
    createdAt: NOW,
    status: 'pending',
    ...overrides,
  };
}

describe('lease DAL', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.resetAllMocks();

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        return callback(prisma as never);
      }

      return callback;
    });
    vi.mocked(prisma.group.findUnique).mockResolvedValue({
      id: 'group-1',
      tournamentId: 'tournament-1',
    } as never);
    vi.mocked(prisma.groupControlLease.findMany).mockResolvedValue([]);
    vi.mocked(prisma.groupControlLease.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.groupControlLease.deleteMany).mockResolvedValue({
      count: 0,
    } as never);
    vi.mocked(prisma.leaseTakeoverRequest.findMany).mockResolvedValue([]);
    vi.mocked(prisma.leaseTakeoverRequest.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.leaseTakeoverRequest.updateMany).mockResolvedValue({
      count: 0,
    } as never);
    vi.mocked(prisma.tournamentActivity.create).mockResolvedValue({} as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('acquires an available group lease and writes an audit row', async () => {
    const createdLease = activeLease({
      adminId: 'admin-1',
      deviceId: 'device-1',
    });
    vi.mocked(prisma.groupControlLease.create).mockResolvedValue(
      createdLease as never
    );

    const result = await acquire({
      groupId: 'group-1',
      deviceId: 'device-1',
      adminId: 'admin-1',
    });

    expect(prisma.groupControlLease.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        groupId: 'group-1',
        tournamentId: 'tournament-1',
        adminId: 'admin-1',
        deviceId: 'device-1',
        acquiredAt: NOW,
        lastHeartbeatAt: NOW,
        expiresAt: new Date('2026-05-01T10:01:00.000Z'),
      }),
    });
    expect(prisma.tournamentActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tournamentId: 'tournament-1',
        adminId: 'admin-1',
        eventType: 'lease.acquire',
        entityType: 'group',
        entityId: 'group-1',
      }),
    });
    expect(result).toEqual(createdLease);
  });

  it('rejects acquire when audit insertion fails inside the transaction', async () => {
    vi.mocked(prisma.groupControlLease.create).mockResolvedValue(
      activeLease({
        adminId: 'admin-1',
        deviceId: 'device-1',
      }) as never
    );
    vi.mocked(prisma.tournamentActivity.create).mockRejectedValueOnce(
      new Error('audit failed')
    );

    await expect(
      acquire({
        groupId: 'group-1',
        deviceId: 'device-1',
        adminId: 'admin-1',
      })
    ).rejects.toThrow('audit failed');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('surfaces a stable domain error when acquire loses a unique-constraint race', async () => {
    vi.mocked(prisma.groupControlLease.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(
        activeLease({
          deviceId: 'device-2',
          adminId: 'admin-2',
        }) as never
      );
    vi.mocked(prisma.groupControlLease.create).mockRejectedValueOnce(
      uniqueConstraintError()
    );

    await expect(
      acquire({
        groupId: 'group-1',
        deviceId: 'device-1',
        adminId: 'admin-1',
      })
    ).rejects.toThrow('Group is currently controlled by another device');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('rejects acquire when another device still holds the lease', async () => {
    vi.mocked(prisma.groupControlLease.findUnique).mockResolvedValue(
      activeLease() as never
    );

    await expect(
      acquire({
        groupId: 'group-1',
        deviceId: 'device-2',
        adminId: 'admin-2',
      })
    ).rejects.toThrow('Group is currently controlled by another device');

    expect(prisma.groupControlLease.create).not.toHaveBeenCalled();
    expect(prisma.tournamentActivity.create).not.toHaveBeenCalled();
  });

  it('rejects acquire when the same device already holds the lease', async () => {
    vi.mocked(prisma.groupControlLease.findUnique).mockResolvedValue(
      activeLease({
        deviceId: 'device-1',
        adminId: 'admin-1',
      }) as never
    );

    await expect(
      acquire({
        groupId: 'group-1',
        deviceId: 'device-1',
        adminId: 'admin-1',
      })
    ).rejects.toThrow('Group is already controlled by this device');

    expect(prisma.groupControlLease.update).not.toHaveBeenCalled();
    expect(prisma.groupControlLease.create).not.toHaveBeenCalled();
    expect(prisma.tournamentActivity.create).not.toHaveBeenCalled();
  });

  it('extends the active lease heartbeat without writing audit rows', async () => {
    const updatedLease = activeLease({
      lastHeartbeatAt: NOW,
      expiresAt: new Date('2026-05-01T10:01:00.000Z'),
    });
    vi.mocked(prisma.groupControlLease.findUnique).mockResolvedValue(
      activeLease({
        deviceId: 'device-1',
        adminId: 'admin-1',
      }) as never
    );
    vi.mocked(prisma.groupControlLease.update).mockResolvedValue(
      updatedLease as never
    );

    const result = await heartbeat({
      groupId: 'group-1',
      deviceId: 'device-1',
      adminId: 'admin-1',
    });

    expect(prisma.groupControlLease.update).toHaveBeenCalledWith({
      where: { id: 'lease-1' },
      data: expect.objectContaining({
        lastHeartbeatAt: NOW,
        expiresAt: new Date('2026-05-01T10:01:00.000Z'),
      }),
    });
    expect(prisma.tournamentActivity.create).not.toHaveBeenCalled();
    expect(result).toEqual(updatedLease);
  });

  it('rejects heartbeat when the admin does not own the matching device lease', async () => {
    vi.mocked(prisma.groupControlLease.findUnique).mockResolvedValue(
      activeLease({
        deviceId: 'device-1',
        adminId: 'admin-owner',
      }) as never
    );

    await expect(
      heartbeat({
        groupId: 'group-1',
        deviceId: 'device-1',
        adminId: 'admin-other',
      })
    ).rejects.toThrow('Lease is not held by this admin/device');

    expect(prisma.groupControlLease.update).not.toHaveBeenCalled();
  });

  it('releases the current device lease, clears pending requests, and audits it', async () => {
    const heldLease = activeLease({
      deviceId: 'device-1',
      adminId: 'admin-1',
    });
    vi.mocked(prisma.groupControlLease.findUnique).mockResolvedValue(
      heldLease as never
    );
    vi.mocked(prisma.groupControlLease.delete).mockResolvedValue(
      heldLease as never
    );
    vi.mocked(prisma.leaseTakeoverRequest.updateMany).mockResolvedValue({
      count: 2,
    } as never);

    const result = await release({
      groupId: 'group-1',
      deviceId: 'device-1',
      adminId: 'admin-1',
    });

    expect(prisma.leaseTakeoverRequest.updateMany).toHaveBeenCalledWith({
      where: {
        leaseId: 'lease-1',
        status: 'pending',
      },
      data: { status: 'expired' },
    });
    expect(prisma.groupControlLease.delete).toHaveBeenCalledWith({
      where: { id: 'lease-1' },
    });
    expect(prisma.tournamentActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tournamentId: 'tournament-1',
        adminId: 'admin-1',
        eventType: 'lease.release',
        entityType: 'group',
        entityId: 'group-1',
      }),
    });
    expect(result).toEqual(heldLease);
  });

  it('rejects release when audit insertion fails inside the transaction', async () => {
    vi.mocked(prisma.groupControlLease.findUnique).mockResolvedValue(
      activeLease({
        deviceId: 'device-1',
        adminId: 'admin-1',
      }) as never
    );
    vi.mocked(prisma.groupControlLease.delete).mockResolvedValue(
      activeLease({
        deviceId: 'device-1',
        adminId: 'admin-1',
      }) as never
    );
    vi.mocked(prisma.tournamentActivity.create).mockRejectedValueOnce(
      new Error('audit failed')
    );

    await expect(
      release({
        groupId: 'group-1',
        deviceId: 'device-1',
        adminId: 'admin-1',
      })
    ).rejects.toThrow('audit failed');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('rejects release when the admin does not own the matching device lease', async () => {
    vi.mocked(prisma.groupControlLease.findUnique).mockResolvedValue(
      activeLease({
        deviceId: 'device-1',
        adminId: 'admin-owner',
      }) as never
    );

    await expect(
      release({
        groupId: 'group-1',
        deviceId: 'device-1',
        adminId: 'admin-other',
      })
    ).rejects.toThrow('Lease is not held by this admin/device');

    expect(prisma.groupControlLease.delete).not.toHaveBeenCalled();
    expect(prisma.leaseTakeoverRequest.updateMany).not.toHaveBeenCalledWith({
      where: {
        leaseId: 'lease-1',
        status: 'pending',
      },
      data: { status: 'expired' },
    });
  });

  it('creates a pending takeover request for another active holder and audits it', async () => {
    const createdRequest = pendingRequest();
    vi.mocked(prisma.groupControlLease.findUnique).mockResolvedValue(
      activeLease() as never
    );
    vi.mocked(prisma.leaseTakeoverRequest.create).mockResolvedValue(
      createdRequest as never
    );

    const result = await requestTakeover({
      groupId: 'group-1',
      deviceId: 'device-requester',
      adminId: 'admin-requester',
    });

    expect(prisma.leaseTakeoverRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leaseId: 'lease-1',
        requesterDeviceId: 'device-requester',
        requesterAdminId: 'admin-requester',
        createdAt: NOW,
        status: 'pending',
      }),
    });
    expect(prisma.tournamentActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tournamentId: 'tournament-1',
        adminId: 'admin-requester',
        eventType: 'lease.takeover_request',
        entityType: 'group',
        entityId: 'group-1',
      }),
    });
    expect(result).toEqual(createdRequest);
  });

  it('returns the existing pending takeover request for the same requester without creating a duplicate', async () => {
    const existingRequest = pendingRequest();
    vi.mocked(prisma.groupControlLease.findUnique).mockResolvedValue(
      activeLease() as never
    );
    vi.mocked(prisma.leaseTakeoverRequest.findUnique).mockResolvedValueOnce(
      existingRequest as never
    );

    const result = await requestTakeover({
      groupId: 'group-1',
      deviceId: 'device-requester',
      adminId: 'admin-requester',
    });

    expect(prisma.leaseTakeoverRequest.create).not.toHaveBeenCalled();
    expect(prisma.leaseTakeoverRequest.update).not.toHaveBeenCalled();
    expect(prisma.tournamentActivity.create).not.toHaveBeenCalled();
    expect(result).toEqual(existingRequest);
  });

  it('reopens a non-pending takeover request for the same requester and audits it once', async () => {
    const deniedRequest = pendingRequest({
      status: 'denied',
      createdAt: new Date('2026-05-01T09:59:00.000Z'),
    });
    const reopenedRequest = {
      ...deniedRequest,
      status: 'pending',
      createdAt: NOW,
    };
    vi.mocked(prisma.groupControlLease.findUnique).mockResolvedValue(
      activeLease() as never
    );
    vi.mocked(prisma.leaseTakeoverRequest.findUnique)
      .mockResolvedValueOnce(deniedRequest as never)
      .mockResolvedValueOnce(reopenedRequest as never);
    vi.mocked(prisma.leaseTakeoverRequest.updateMany)
      .mockResolvedValueOnce({ count: 0 } as never)
      .mockResolvedValueOnce({ count: 1 } as never);

    const result = await requestTakeover({
      groupId: 'group-1',
      deviceId: 'device-requester',
      adminId: 'admin-requester',
    });

    expect(prisma.leaseTakeoverRequest.create).not.toHaveBeenCalled();
    expect(prisma.tournamentActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tournamentId: 'tournament-1',
        adminId: 'admin-requester',
        eventType: 'lease.takeover_request',
        entityType: 'group',
        entityId: 'group-1',
      }),
    });
    expect(result).toEqual(reopenedRequest);
  });

  it('replaces a stale approved requester row with a fresh pending takeover request', async () => {
    const approvedRequest = pendingRequest({
      status: 'approved',
      createdAt: new Date('2026-05-01T09:59:00.000Z'),
    });
    const replacementRequest = pendingRequest({
      id: 'request-2',
      status: 'pending',
      createdAt: NOW,
    });
    vi.mocked(prisma.groupControlLease.findUnique).mockResolvedValue(
      activeLease() as never
    );
    vi.mocked(prisma.leaseTakeoverRequest.findUnique).mockResolvedValueOnce(
      approvedRequest as never
    );
    vi.mocked(prisma.leaseTakeoverRequest.delete).mockResolvedValue(
      approvedRequest as never
    );
    vi.mocked(prisma.leaseTakeoverRequest.create).mockResolvedValue(
      replacementRequest as never
    );

    const result = await requestTakeover({
      groupId: 'group-1',
      deviceId: 'device-requester',
      adminId: 'admin-requester',
    });

    expect(prisma.leaseTakeoverRequest.delete).toHaveBeenCalledWith({
      where: { id: 'request-1' },
    });
    expect(prisma.leaseTakeoverRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leaseId: 'lease-1',
        requesterDeviceId: 'device-requester',
        requesterAdminId: 'admin-requester',
        createdAt: NOW,
        status: 'pending',
      }),
    });
    expect(prisma.tournamentActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tournamentId: 'tournament-1',
        adminId: 'admin-requester',
        eventType: 'lease.takeover_request',
        entityType: 'group',
        entityId: 'group-1',
      }),
    });
    expect(result).toEqual(replacementRequest);
  });

  it('returns the concurrent pending takeover request when create loses a unique-constraint race', async () => {
    const concurrentRequest = pendingRequest();
    vi.mocked(prisma.groupControlLease.findUnique).mockResolvedValue(
      activeLease() as never
    );
    vi.mocked(prisma.leaseTakeoverRequest.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(concurrentRequest as never);
    vi.mocked(prisma.leaseTakeoverRequest.create).mockRejectedValueOnce(
      uniqueConstraintError()
    );

    const result = await requestTakeover({
      groupId: 'group-1',
      deviceId: 'device-requester',
      adminId: 'admin-requester',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.tournamentActivity.create).not.toHaveBeenCalled();
    expect(result).toEqual(concurrentRequest);
  });

  it('replaces an already approved requester row after a duplicate-submit unique race', async () => {
    const approvedRequest = pendingRequest({
      status: 'approved',
    });
    const replacementRequest = pendingRequest({
      id: 'request-2',
      status: 'pending',
    });
    vi.mocked(prisma.groupControlLease.findUnique).mockResolvedValue(
      activeLease() as never
    );
    vi.mocked(prisma.leaseTakeoverRequest.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(approvedRequest as never);
    vi.mocked(prisma.leaseTakeoverRequest.create).mockRejectedValueOnce(
      uniqueConstraintError()
    );
    vi.mocked(prisma.leaseTakeoverRequest.delete).mockResolvedValue(
      approvedRequest as never
    );
    vi.mocked(prisma.leaseTakeoverRequest.create).mockResolvedValueOnce(
      replacementRequest as never
    );

    const result = await requestTakeover({
      groupId: 'group-1',
      deviceId: 'device-requester',
      adminId: 'admin-requester',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(prisma.leaseTakeoverRequest.delete).toHaveBeenCalledWith({
      where: { id: 'request-1' },
    });
    expect(prisma.leaseTakeoverRequest.update).not.toHaveBeenCalled();
    expect(prisma.tournamentActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: 'lease.takeover_request',
      }),
    });
    expect(result).toEqual(replacementRequest);
  });

  it('rejects reopened takeover request when audit insertion fails inside the transaction', async () => {
    const deniedRequest = pendingRequest({
      status: 'denied',
      createdAt: new Date('2026-05-01T09:59:00.000Z'),
    });
    const reopenedRequest = {
      ...deniedRequest,
      status: 'pending',
      createdAt: NOW,
    };
    vi.mocked(prisma.groupControlLease.findUnique).mockResolvedValue(
      activeLease() as never
    );
    vi.mocked(prisma.leaseTakeoverRequest.findUnique)
      .mockResolvedValueOnce(deniedRequest as never)
      .mockResolvedValueOnce(reopenedRequest as never);
    vi.mocked(prisma.leaseTakeoverRequest.updateMany)
      .mockResolvedValueOnce({ count: 0 } as never)
      .mockResolvedValueOnce({ count: 1 } as never);
    vi.mocked(prisma.tournamentActivity.create).mockRejectedValueOnce(
      new Error('audit failed')
    );

    await expect(
      requestTakeover({
        groupId: 'group-1',
        deviceId: 'device-requester',
        adminId: 'admin-requester',
      })
    ).rejects.toThrow('audit failed');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('approves a pending takeover, transfers the lease, clears the queue, and audits it', async () => {
    const request = pendingRequest({
      lease: activeLease({
        deviceId: 'device-holder',
        adminId: 'admin-holder',
      }),
    });
    const transferredLease = activeLease({
      adminId: 'admin-requester',
      deviceId: 'device-requester',
      acquiredAt: NOW,
      lastHeartbeatAt: NOW,
      expiresAt: new Date('2026-05-01T10:01:00.000Z'),
    });

    vi.mocked(prisma.leaseTakeoverRequest.findUnique).mockResolvedValue(
      request as never
    );
    vi.mocked(prisma.groupControlLease.update).mockResolvedValue(
      transferredLease as never
    );
    vi.mocked(prisma.leaseTakeoverRequest.update).mockResolvedValue({
      ...request,
      status: 'approved',
    } as never);
    vi.mocked(prisma.leaseTakeoverRequest.updateMany).mockResolvedValue({
      count: 3,
    } as never);

    const result = await respondTakeover({
      requestId: 'request-1',
      approve: true,
      adminId: 'admin-holder',
      deviceId: 'device-holder',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.groupControlLease.update).toHaveBeenCalledWith({
      where: { id: 'lease-1' },
      data: expect.objectContaining({
        adminId: 'admin-requester',
        deviceId: 'device-requester',
        acquiredAt: NOW,
        lastHeartbeatAt: NOW,
        expiresAt: new Date('2026-05-01T10:01:00.000Z'),
      }),
    });
    expect(prisma.leaseTakeoverRequest.update).toHaveBeenCalledWith({
      where: { id: 'request-1' },
      data: { status: 'approved' },
    });
    expect(prisma.leaseTakeoverRequest.updateMany).toHaveBeenCalledWith({
      where: {
        leaseId: 'lease-1',
        id: { not: 'request-1' },
        status: 'pending',
      },
      data: { status: 'expired' },
    });
    expect(prisma.tournamentActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tournamentId: 'tournament-1',
        adminId: 'admin-holder',
        eventType: 'lease.takeover_approve',
        entityType: 'group',
        entityId: 'group-1',
      }),
    });
    expect(result).toEqual(transferredLease);
  });

  it('rejects takeover response when the device does not match the current holder', async () => {
    vi.mocked(prisma.leaseTakeoverRequest.findUnique).mockResolvedValue(
      pendingRequest({
        lease: activeLease({
          deviceId: 'device-holder',
          adminId: 'admin-holder',
        }),
      }) as never
    );

    await expect(
      respondTakeover({
        requestId: 'request-1',
        approve: true,
        adminId: 'admin-holder',
        deviceId: 'device-other',
      })
    ).rejects.toThrow('Only the current lease holder can respond');

    expect(prisma.groupControlLease.update).not.toHaveBeenCalled();
    expect(prisma.leaseTakeoverRequest.update).not.toHaveBeenCalled();
  });

  it('denies a takeover request without changing lease ownership and records deny activity', async () => {
    const request = pendingRequest({
      lease: activeLease({
        deviceId: 'device-holder',
        adminId: 'admin-holder',
      }),
    });
    const deniedRequest = {
      ...request,
      status: 'denied',
    };
    vi.mocked(prisma.leaseTakeoverRequest.findUnique).mockResolvedValue(
      request as never
    );
    vi.mocked(prisma.leaseTakeoverRequest.update).mockResolvedValue(
      deniedRequest as never
    );

    const result = await respondTakeover({
      requestId: 'request-1',
      approve: false,
      adminId: 'admin-holder',
      deviceId: 'device-holder',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.groupControlLease.update).not.toHaveBeenCalled();
    expect(prisma.leaseTakeoverRequest.update).toHaveBeenCalledWith({
      where: { id: 'request-1' },
      data: { status: 'denied' },
    });
    expect(prisma.tournamentActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tournamentId: 'tournament-1',
        adminId: 'admin-holder',
        eventType: 'lease.takeover_deny',
        entityType: 'group',
        entityId: 'group-1',
      }),
    });
    expect(result).toEqual(deniedRequest);
  });

  it('publishes invalidation when cleanup expires lease state before listing', async () => {
    vi.mocked(prisma.groupControlLease.findMany)
      .mockResolvedValueOnce([
        {
          id: 'lease-expired',
          tournamentId: 'tournament-1',
        },
      ] as never)
      .mockResolvedValueOnce([] as never);
    vi.mocked(prisma.leaseTakeoverRequest.findMany).mockResolvedValueOnce([
      {
        lease: {
          tournamentId: 'tournament-1',
        },
      },
    ] as never);

    await listForTournament({
      tournamentId: 'tournament-1',
    });

    expect(publishLeaseEvent).toHaveBeenCalledWith({
      type: 'invalidate',
      tournamentId: 'tournament-1',
    });
  });

  it('lists active tournament leases with device-specific lease status', async () => {
    vi.mocked(prisma.groupControlLease.findMany).mockResolvedValue([
      {
        ...activeLease(),
        takeoverRequests: [
          pendingRequest(),
          pendingRequest({
            id: 'request-2',
            requesterDeviceId: 'device-other',
          }),
        ],
      },
    ] as never);

    const result = await listForTournament({
      tournamentId: 'tournament-1',
      deviceId: 'device-requester',
    });

    expect(result).toEqual([
      expect.objectContaining({
        id: 'lease-1',
        groupId: 'group-1',
        leaseStatus: 'pending_takeover',
        takeoverRequests: expect.arrayContaining([
          expect.objectContaining({
            id: 'request-1',
            requesterAdminId: 'admin-requester',
            status: 'pending',
          }),
        ]),
      }),
    ]);
    expect(result[0]).not.toHaveProperty('adminId');
    expect(result[0]).not.toHaveProperty('deviceId');
    expect(result[0]?.takeoverRequests[0]).not.toHaveProperty(
      'requesterDeviceId'
    );
  });
});
