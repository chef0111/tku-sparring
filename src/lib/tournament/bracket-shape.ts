import { buildSlotMap } from './bracket-seeding';

import type { CreateMatchDTO } from '@/orpc/matches/dto';

export function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function createEmptyMatch(
  groupId: string,
  tournamentId: string,
  round: number,
  matchIndex: number
): CreateMatchDTO {
  return {
    kind: 'bracket',
    round,
    matchIndex,
    status: 'pending',
    redTournamentAthleteId: null,
    blueTournamentAthleteId: null,
    redAthleteId: null,
    blueAthleteId: null,
    redLocked: false,
    blueLocked: false,
    groupId,
    tournamentId,
  };
}

export function planBracketShell(input: {
  groupId: string;
  tournamentId: string;
  athleteCount: number;
  thirdPlaceMatch: boolean;
}): {
  bracketSize: number;
  totalRounds: number;
  matches: Array<CreateMatchDTO>;
} {
  const bracketSize = nextPowerOfTwo(input.athleteCount);
  const totalRounds = Math.log2(bracketSize);
  const matches: Array<CreateMatchDTO> = [];

  for (let round = 0; round < totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round + 1);
    for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex++) {
      matches.push(
        createEmptyMatch(input.groupId, input.tournamentId, round, matchIndex)
      );
    }
  }

  if (input.thirdPlaceMatch && input.athleteCount >= 4) {
    matches.push(
      createEmptyMatch(input.groupId, input.tournamentId, totalRounds, 0)
    );
  }

  return { bracketSize, totalRounds, matches };
}

export type PlacementAthlete = {
  id: string;
  athleteProfileId: string | null;
};

export type Round0PlacementMatch = {
  id: string;
  matchIndex: number;
  redLocked: boolean;
  blueLocked: boolean;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
  redAthleteId: string | null;
  blueAthleteId: string | null;
};

export type Round0PlacementUpdate = {
  matchId: string;
  data: {
    redTournamentAthleteId: string | null;
    blueTournamentAthleteId: string | null;
    redAthleteId: string | null;
    blueAthleteId: string | null;
    redWins: number;
    blueWins: number;
    winnerId: null;
    winnerTournamentAthleteId: null;
    status: 'pending';
  };
};

function planRound0MatchUpdate(
  match: Round0PlacementMatch,
  slotMapSeeds: Array<number>,
  seedToAthlete: Map<number, PlacementAthlete>,
  athleteCount: number
): Round0PlacementUpdate {
  let redTa = match.redTournamentAthleteId;
  let blueTa = match.blueTournamentAthleteId;
  let redProfile = match.redAthleteId;
  let blueProfile = match.blueAthleteId;

  if (!match.redLocked) {
    const seed = slotMapSeeds[match.matchIndex * 2]!;
    if (seed > athleteCount) {
      redTa = null;
      redProfile = null;
    } else {
      const placed = seedToAthlete.get(seed);
      redTa = placed?.id ?? null;
      redProfile = placed?.athleteProfileId ?? null;
    }
  }
  if (!match.blueLocked) {
    const seed = slotMapSeeds[match.matchIndex * 2 + 1]!;
    if (seed > athleteCount) {
      blueTa = null;
      blueProfile = null;
    } else {
      const placed = seedToAthlete.get(seed);
      blueTa = placed?.id ?? null;
      blueProfile = placed?.athleteProfileId ?? null;
    }
  }

  return {
    matchId: match.id,
    data: {
      redTournamentAthleteId: redTa,
      blueTournamentAthleteId: blueTa,
      redAthleteId: redProfile,
      blueAthleteId: blueProfile,
      redWins: 0,
      blueWins: 0,
      winnerId: null,
      winnerTournamentAthleteId: null,
      status: 'pending',
    },
  };
}

export function planRound0Placements(input: {
  bracketSize: number;
  athletes: Array<PlacementAthlete>;
  round0Matches: Array<Round0PlacementMatch>;
  /** Shuffled pool of athletes not in locked slots (same as `shuffleAthletePool` on unlocked pool). */
  shuffledAthletes: Array<PlacementAthlete>;
}): { updates: Array<Round0PlacementUpdate> } {
  const slotMapSeeds = buildSlotMap(input.bracketSize);
  const lockedSeedPositions = new Set<number>();

  for (const m of input.round0Matches) {
    if (m.redLocked && m.redTournamentAthleteId) {
      lockedSeedPositions.add(slotMapSeeds[m.matchIndex * 2]!);
    }
    if (m.blueLocked && m.blueTournamentAthleteId) {
      lockedSeedPositions.add(slotMapSeeds[m.matchIndex * 2 + 1]!);
    }
  }

  const seedToAthlete = new Map<number, PlacementAthlete>();
  let si = 0;
  for (let seed = 1; seed <= input.bracketSize; seed++) {
    if (seed > input.athletes.length) continue;
    if (lockedSeedPositions.has(seed)) continue;
    const next = input.shuffledAthletes[si++] ?? null;
    if (next) seedToAthlete.set(seed, next);
  }

  return {
    updates: input.round0Matches.map((match) =>
      planRound0MatchUpdate(
        match,
        slotMapSeeds,
        seedToAthlete,
        input.athletes.length
      )
    ),
  };
}
