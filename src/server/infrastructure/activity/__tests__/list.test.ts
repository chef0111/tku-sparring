import { beforeEach, describe, expect, it, vi } from 'vitest';

import { activityListStore } from '@/server/infrastructure/activity';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    tournamentActivity: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    user: { findMany: vi.fn() },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('activityListStore.list', () => {
  it('returns summaries and admin names', async () => {
    const createdAt = new Date('2024-01-02T12:00:00Z');
    vi.mocked(prisma.tournamentActivity.findMany).mockResolvedValue([
      {
        id: 'a1',
        createdAt,
        eventType: 'tournament.status_change',
        adminId: 'u1',
        entityType: 'tournament',
        entityId: 't1',
        payload: { fromStatus: 'draft', toStatus: 'active' },
      },
    ] as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'u1', name: 'Admin One' },
    ] as never);

    const result = await activityListStore.list({
      tournamentId: 't1',
      limit: 50,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].adminName).toBe('Admin One');
    expect(result.items[0].summary).toContain('draft');
    expect(result.nextCursor).toBeNull();
  });

  it('applies eventTypes filter in the query', async () => {
    vi.mocked(prisma.tournamentActivity.findMany).mockResolvedValue([]);

    await activityListStore.list({
      tournamentId: 't1',
      eventTypes: ['bracket.generate', 'bracket.regenerate'],
    });

    expect(prisma.tournamentActivity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tournamentId: 't1',
          eventType: { in: ['bracket.generate', 'bracket.regenerate'] },
        }),
      })
    );
  });
});
