import type { QueryClient } from '@tanstack/react-query';
import type {
  AssignSlotDTO,
  SetLockDTO,
  SwapParticipantsDTO,
  SwapSlotsDTO,
  UpdateScoreDTO,
} from '@/orpc/matches/dto';
import type { MatchData } from '@/contracts/tournament/match';
import {
  getSuccessorSlot,
  resolveAdvanceSide,
} from '@/lib/tournament/bracket/bracket-progression';
import { getScoreTransition } from '@/lib/tournament/match-transition';
import { matchKeys } from '@/queries/keys';

export type MatchListQueryKey = ReturnType<typeof matchKeys.listByGroup>;

export type BracketDnDMutationContext = {
  queryKey: MatchListQueryKey;
  previousMatches: Array<MatchData> | undefined;
};

export function findMatchListQueryKey(
  queryClient: QueryClient,
  matchId: string
): MatchListQueryKey | null {
  for (const [key, data] of queryClient.getQueriesData<Array<MatchData>>({
    queryKey: matchKeys.lists(),
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

export function applyOptimisticSwapParticipants(
  matches: Array<MatchData>,
  input: SwapParticipantsDTO
): Array<MatchData> {
  const out = matches.map((m) => ({ ...m }));
  const m = out.find((x) => x.id === input.matchId);
  if (!m) return out;

  const prevRedTa = m.redTournamentAthleteId;
  const prevRedProf = m.redAthleteId;
  const prevBlueTa = m.blueTournamentAthleteId;
  const prevBlueProf = m.blueAthleteId;

  m.redTournamentAthleteId = input.redTournamentAthleteId;
  m.blueTournamentAthleteId = input.blueTournamentAthleteId;

  if (m.round > 0) {
    m.cornersSwapped = !m.cornersSwapped;
  }

  m.redAthleteId =
    input.redTournamentAthleteId === prevBlueTa
      ? prevBlueProf
      : input.redTournamentAthleteId === prevRedTa
        ? prevRedProf
        : input.redTournamentAthleteId
          ? findProfileId(matches, input.redTournamentAthleteId)
          : null;

  m.blueAthleteId =
    input.blueTournamentAthleteId === prevRedTa
      ? prevRedProf
      : input.blueTournamentAthleteId === prevBlueTa
        ? prevBlueProf
        : input.blueTournamentAthleteId
          ? findProfileId(matches, input.blueTournamentAthleteId)
          : null;

  return out;
}

export function applyOptimisticUpdateScore(
  matches: Array<MatchData>,
  input: UpdateScoreDTO
): Array<MatchData> {
  const out = matches.map((m) => ({ ...m }));
  const m = out.find((x) => x.id === input.matchId);
  if (!m) return out;

  const transition = getScoreTransition({
    match: m,
    redWins: input.redWins,
    blueWins: input.blueWins,
  });

  Object.assign(m, transition.data);

  if (transition.data.status !== 'complete' || !transition.advancedWinnerId) {
    return out;
  }

  const successor = getSuccessorSlot({
    round: m.round,
    matchIndex: m.matchIndex,
  });
  const next = out.find(
    (x) =>
      x.kind === 'bracket' &&
      x.groupId === m.groupId &&
      x.round === successor.round &&
      x.matchIndex === successor.matchIndex
  );
  if (!next) return out;

  const wta = transition.advancedWinnerId;
  const profileId = findProfileId(matches, wta);
  const side = resolveAdvanceSide(successor.side, next.cornersSwapped);
  if (side === 'red') {
    next.redTournamentAthleteId = wta;
    next.redAthleteId = profileId;
  } else {
    next.blueTournamentAthleteId = wta;
    next.blueAthleteId = profileId;
  }

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
