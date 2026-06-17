import { prisma } from '@/lib/db';

export async function loadActiveClaimsByMatchId(
  matchIds: Array<string>,
  now: Date
): Promise<Map<string, { deviceId: string }>> {
  if (matchIds.length === 0) {
    return new Map();
  }
  const rows = await prisma.arenaMatchClaim.findMany({
    where: {
      matchId: { in: matchIds },
      expiresAt: { gt: now },
    },
    select: { matchId: true, deviceId: true },
  });
  return new Map(rows.map((r) => [r.matchId, { deviceId: r.deviceId }]));
}
