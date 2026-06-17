import type { Prisma } from '@/generated/prisma/client';
import type { ActivityListStore } from '@/server/application/activity/repositories/list';
import type { ListActivityQuery } from '@/server/application/activity/use-cases/list-commands';
import { summarizeTournamentActivity } from '@/server/application/activity/summarize';
import { prisma } from '@/lib/db';

const DEFAULT_ACTIVITY_PAGE_SIZE = 10;
const MAX_ACTIVITY_PAGE_SIZE = 100;

export const activityListStore: ActivityListStore = {
  async list(input: ListActivityQuery) {
    const limit = Math.min(
      Math.max(1, input.limit ?? DEFAULT_ACTIVITY_PAGE_SIZE),
      MAX_ACTIVITY_PAGE_SIZE
    );

    let cursorCreatedAt: Date | undefined;
    let cursorId: string | undefined;
    if (input.cursor?.id) {
      const row = await prisma.tournamentActivity.findUnique({
        where: { id: input.cursor.id },
        select: { createdAt: true, id: true, tournamentId: true },
      });
      if (row && row.tournamentId === input.tournamentId) {
        cursorCreatedAt = row.createdAt;
        cursorId = row.id;
      }
    }

    const where: Prisma.TournamentActivityWhereInput = {
      tournamentId: input.tournamentId,
      ...(input.eventTypes && input.eventTypes.length > 0
        ? { eventType: { in: input.eventTypes } }
        : {}),
      ...(cursorCreatedAt &&
        cursorId && {
          OR: [
            { createdAt: { lt: cursorCreatedAt } },
            {
              AND: [{ createdAt: cursorCreatedAt }, { id: { lt: cursorId } }],
            },
          ],
        }),
    };

    const rows = await prisma.tournamentActivity.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const page = rows.slice(0, limit);
    const adminIds = [...new Set(page.map((r) => r.adminId))];
    const users =
      adminIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: adminIds } },
            select: { id: true, name: true },
          })
        : [];
    const nameById = new Map(users.map((u) => [u.id, u.name]));

    const items = page.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      eventType: r.eventType,
      adminId: r.adminId,
      adminName: nameById.get(r.adminId) ?? r.adminId,
      entityType: r.entityType,
      entityId: r.entityId,
      payload: r.payload,
      summary: summarizeTournamentActivity(r.eventType, r.payload),
    }));

    const hasMore = rows.length > limit;
    const nextCursor =
      hasMore && page.length > 0 ? { id: page[page.length - 1].id } : null;

    return { items, nextCursor };
  },
};
