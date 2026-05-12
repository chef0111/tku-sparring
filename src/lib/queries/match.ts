import type { QueryClient } from '@tanstack/react-query';
import type {
  AssignSlotDTO,
  SetLockDTO,
  SwapSlotsDTO,
} from '@/orpc/matches/matches.dto';
import type { MatchData } from '@/features/dashboard/types';

export type MatchListQueryKey = readonly ['match', 'list', string];

export type BracketDnDMutationContext = {
  queryKey: MatchListQueryKey;
  previousMatches: Array<MatchData> | undefined;
};

export function findMatchListQueryKey(
  queryClient: QueryClient,
  matchId: string
): MatchListQueryKey | null {
  for (const [key, data] of queryClient.getQueriesData<Array<MatchData>>({
    queryKey: ['match', 'list'],
  })) {
    if (!Array.isArray(key) || key.length !== 3) continue;
    if (!Array.isArray(data)) continue;
    if (data.some((m) => m.id === matchId)) {
      return key as unknown as MatchListQueryKey;
    }
  }
  return null;
}

export function findProfileId(
  matches: Array<MatchData>,
  taId: string
): string | null {
  for (const m of matches) {
    if (m.redTournamentAthleteId === taId && m.redAthleteId != null) {
      return m.redAthleteId;
    }
    if (m.blueTournamentAthleteId === taId && m.blueAthleteId != null) {
      return m.blueAthleteId;
    }
  }
  return null;
}

export function applyOptimisticAssign(
  matches: Array<MatchData>,
  input: AssignSlotDTO
): Array<MatchData> {
  const profileFor = input.tournamentAthleteId
    ? findProfileId(matches, input.tournamentAthleteId)
    : null;
  const out = matches.map((m) => ({ ...m }));

  if (input.tournamentAthleteId) {
    for (const m of out) {
      if (m.round !== 0) continue;
      if (m.id === input.matchId) continue;
      if (m.redTournamentAthleteId === input.tournamentAthleteId) {
        m.redTournamentAthleteId = null;
        m.redAthleteId = null;
      }
      if (m.blueTournamentAthleteId === input.tournamentAthleteId) {
        m.blueTournamentAthleteId = null;
        m.blueAthleteId = null;
      }
    }
  }

  const m = out.find((x) => x.id === input.matchId);
  if (!m) return out;

  if (input.side === 'red') {
    m.redTournamentAthleteId = input.tournamentAthleteId;
    m.redAthleteId = input.tournamentAthleteId ? (profileFor ?? null) : null;
  } else {
    m.blueTournamentAthleteId = input.tournamentAthleteId;
    m.blueAthleteId = input.tournamentAthleteId ? (profileFor ?? null) : null;
  }
  return out;
}

export function applyOptimisticSwap(
  matches: Array<MatchData>,
  input: SwapSlotsDTO
): Array<MatchData> {
  const out = matches.map((m) => ({ ...m }));

  if (input.matchAId === input.matchBId) {
    const m = out.find((x) => x.id === input.matchAId);
    if (!m) return out;
    const rTa = m.redTournamentAthleteId;
    const rProf = m.redAthleteId;
    m.redTournamentAthleteId = m.blueTournamentAthleteId;
    m.redAthleteId = m.blueAthleteId;
    m.blueTournamentAthleteId = rTa;
    m.blueAthleteId = rProf;
    return out;
  }

  const ma = out.find((x) => x.id === input.matchAId);
  const mb = out.find((x) => x.id === input.matchBId);
  if (!ma || !mb) return out;

  const read = (m: MatchData, side: 'red' | 'blue') =>
    side === 'red'
      ? {
          ta: m.redTournamentAthleteId,
          prof: m.redAthleteId,
        }
      : {
          ta: m.blueTournamentAthleteId,
          prof: m.blueAthleteId,
        };

  const write = (
    m: MatchData,
    side: 'red' | 'blue',
    ta: string | null,
    prof: string | null
  ) => {
    if (side === 'red') {
      m.redTournamentAthleteId = ta;
      m.redAthleteId = prof;
    } else {
      m.blueTournamentAthleteId = ta;
      m.blueAthleteId = prof;
    }
  };

  const a = read(ma, input.sideA);
  const b = read(mb, input.sideB);
  write(ma, input.sideA, b.ta, b.prof);
  write(mb, input.sideB, a.ta, a.prof);
  return out;
}

export function applyOptimisticSetLock(
  matches: Array<MatchData>,
  input: SetLockDTO
): Array<MatchData> {
  const out = matches.map((m) => ({ ...m }));
  const m = out.find((x) => x.id === input.matchId);
  if (!m) return out;
  if (input.side === 'red') {
    m.redLocked = input.locked;
  } else {
    m.blueLocked = input.locked;
  }
  return out;
}
