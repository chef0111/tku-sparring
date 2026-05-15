import type { Prisma } from '@prisma/client';
import type { ListTournamentActivityDTO } from './dto';
import { prisma } from '@/lib/db';

type RecordTournamentActivityInput = {
  tournamentId: string;
  adminId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  payload?: Prisma.InputJsonValue;
};

type ActivityDatabase = Pick<typeof prisma, 'tournamentActivity'>;

export async function recordTournamentActivity(
  input: RecordTournamentActivityInput,
  db: ActivityDatabase = prisma
) {
  const { payload = {}, ...data } = input;

  return db.tournamentActivity.create({
    data: {
      ...data,
      payload,
    },
  });
}

const DEFAULT_ACTIVITY_PAGE_SIZE = 10;
const MAX_ACTIVITY_PAGE_SIZE = 100;

function payloadObject(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === 'object' && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : {};
}

export function summarizeTournamentActivity(
  eventType: string,
  payload: unknown
): string {
  const p = payloadObject(payload);
  switch (eventType) {
    case 'tournament.status_change': {
      const forced = p.forced === true ? ' (admin override)' : '';
      return `Tournament status changed from ${String(p.fromStatus)} to ${String(p.toStatus)}${forced}`;
    }
    case 'bracket.generate':
      return `Bracket generated (${String(p.mode ?? 'full')})`;
    case 'bracket.reset':
      return 'Bracket reset (participants cleared)';
    case 'bracket.shuffle':
      return 'Bracket shuffled';
    case 'bracket.regenerate':
      return 'Bracket regenerated';
    case 'match.score_edit':
      return `Match score updated (${String(p.redWins ?? '?')}-${String(p.blueWins ?? '?')})`;
    case 'match.winner_override':
      return `Winner manually set (${String(p.winnerSide ?? '')})`;
    case 'match.status_admin':
      return `Match status set to ${String(p.toStatus ?? '')}${p.clearedScores === true ? ' (scores cleared)' : ''}`;
    case 'match.swap_participants':
      return 'Match participants swapped';
    case 'group.athlete_assigned':
      return `Assigned ${String(p.name ?? 'athlete')} to a group`;
    case 'group.athlete_unassigned':
      return `Unassigned ${String(p.name ?? 'athlete')} from a group`;
    case 'group.auto_assign':
      return `Auto-assigned ${String(p.count ?? 0)} athlete(s) to a group`;
    default:
      return eventType.replace(/\./g, ' ');
  }
}

export async function listTournamentActivity(input: ListTournamentActivityDTO) {
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
}
