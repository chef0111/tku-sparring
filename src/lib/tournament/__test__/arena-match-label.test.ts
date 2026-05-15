import { describe, expect, it } from 'vitest';
import {
  buildArenaMatchNumberById,
  buildSharedArenaMatchNumberById,
  excludedFromArenaDisplaySequence,
  formatArenaMatchHeaderLine,
  formatFeederWinnerLabel,
  formatFeederWinnerPlaceholder,
  getFeederMatch,
  sortMatchesForArenaSequence,
} from '../arena-match-label';
import type { MatchData } from '@/features/dashboard/types';

function m(
  id: string,
  round: number,
  matchIndex: number,
  over: Partial<MatchData> = {}
): MatchData {
  return {
    id,
    round,
    matchIndex,
    status: 'pending',
    bestOf: 3,
    redAthleteId: null,
    blueAthleteId: null,
    redTournamentAthleteId: null,
    blueTournamentAthleteId: null,
    redWins: 0,
    blueWins: 0,
    winnerId: null,
    winnerTournamentAthleteId: null,
    redLocked: false,
    blueLocked: false,
    groupId: 'g',
    tournamentId: 't',
    ...over,
  };
}

describe('sortMatchesForArenaSequence', () => {
  it('orders third-place before final in arena sequence when enabled', () => {
    const matches = [m('f', 2, 0), m('t', 2, 1), m('a', 0, 0)];
    const sorted = sortMatchesForArenaSequence(matches, true);
    expect(sorted.map((x) => x.id)).toEqual(['a', 't', 'f']);
  });

  it('keeps final-round natural index order when third-place is off', () => {
    const matches = [m('f', 2, 0), m('a', 0, 0)];
    const sorted = sortMatchesForArenaSequence(matches, false);
    expect(sorted.map((x) => x.id)).toEqual(['a', 'f']);
  });
});

describe('excludedFromArenaDisplaySequence', () => {
  it('is true for round 0 with exactly one tournament athlete', () => {
    expect(
      excludedFromArenaDisplaySequence(
        m('a', 0, 0, {
          redTournamentAthleteId: 't1',
          blueTournamentAthleteId: null,
        })
      )
    ).toBe(true);
    expect(
      excludedFromArenaDisplaySequence(
        m('b', 0, 0, {
          blueTournamentAthleteId: 't2',
          redTournamentAthleteId: null,
        })
      )
    ).toBe(true);
  });

  it('is false when both or neither sides have an athlete in round 0', () => {
    expect(excludedFromArenaDisplaySequence(m('c', 0, 0))).toBe(false);
    expect(
      excludedFromArenaDisplaySequence(
        m('d', 0, 0, {
          redTournamentAthleteId: 't1',
          blueTournamentAthleteId: 't2',
        })
      )
    ).toBe(false);
  });

  it('is false for rounds after round 0', () => {
    expect(
      excludedFromArenaDisplaySequence(
        m('e', 1, 0, {
          redTournamentAthleteId: 't1',
          blueTournamentAthleteId: null,
        })
      )
    ).toBe(false);
  });
});

describe('formatArenaMatchHeaderLine', () => {
  it('uses Advanced when display number is null or undefined', () => {
    expect(formatArenaMatchHeaderLine(null)).toBe('Advanced');
    expect(formatArenaMatchHeaderLine(undefined)).toBe('Advanced');
  });

  it('prefixes Match when a number is present', () => {
    expect(formatArenaMatchHeaderLine(205)).toBe('Match 205');
  });
});

describe('formatFeederWinnerPlaceholder', () => {
  it('uses Winner n when feeder has an arena number', () => {
    const map = new Map<string, number | null>([['f', 205]]);
    const feeder = m('f', 0, 0, {
      status: 'complete',
      winnerTournamentAthleteId: 'w',
    });
    expect(formatFeederWinnerPlaceholder(feeder, map)).toBe('Winner 205');
  });

  it('uses winner name when no arena number but match is complete', () => {
    const map = new Map<string, number | null>([['f', null]]);
    const feeder = m('f', 0, 0, {
      status: 'complete',
      winnerTournamentAthleteId: 'ta-x',
    });
    expect(formatFeederWinnerPlaceholder(feeder, map, () => 'Pat Lee')).toBe(
      'Pat Lee'
    );
  });

  it('falls back to Advanced when no number and no name', () => {
    const map = new Map<string, number | null>([['f', null]]);
    const feeder = m('f', 0, 0, { status: 'pending' });
    expect(formatFeederWinnerPlaceholder(feeder, map)).toBe('Advanced');
  });
});

describe('buildArenaMatchNumberById', () => {
  it('skips sequence for round-0 advanceds; every id has a map entry', () => {
    const matches = [
      m('bye0', 0, 0, {
        redTournamentAthleteId: 't1',
        blueTournamentAthleteId: null,
      }),
      m('bye1', 0, 1, {
        blueTournamentAthleteId: 't2',
        redTournamentAthleteId: null,
      }),
      m('real', 0, 2, {
        redTournamentAthleteId: 't3',
        blueTournamentAthleteId: 't4',
      }),
      m('bye3', 0, 3, {
        redTournamentAthleteId: 't5',
        blueTournamentAthleteId: null,
      }),
      m('sf0', 1, 0),
      m('sf1', 1, 1),
      m('fn', 2, 0),
    ];
    const map = buildArenaMatchNumberById(matches, 1, false);
    for (const x of matches) {
      expect(map.has(x.id)).toBe(true);
    }
    expect(map.get('bye0')).toBeNull();
    expect(map.get('bye1')).toBeNull();
    expect(map.get('real')).toBe(101);
    expect(map.get('bye3')).toBeNull();
    expect(map.get('sf0')).toBe(102);
    expect(map.get('sf1')).toBe(103);
    expect(map.get('fn')).toBe(104);
  });

  it('assigns 101..108 for an 8-bracket with third on arena 1', () => {
    const matches = [
      m('r0-0', 0, 0),
      m('r0-1', 0, 1),
      m('r0-2', 0, 2),
      m('r0-3', 0, 3),
      m('r1-0', 1, 0),
      m('r1-1', 1, 1),
      m('tp', 2, 1),
      m('fn', 2, 0),
    ];
    const map = buildArenaMatchNumberById(matches, 1, true);
    expect(map.get('r0-0')).toBe(101);
    expect(map.get('r0-1')).toBe(102);
    expect(map.get('r0-2')).toBe(103);
    expect(map.get('r0-3')).toBe(104);
    expect(map.get('r1-0')).toBe(105);
    expect(map.get('r1-1')).toBe(106);
    expect(map.get('tp')).toBe(107);
    expect(map.get('fn')).toBe(108);
    for (const x of matches) {
      expect(map.has(x.id)).toBe(true);
    }
  });

  it('uses arena 2 base 200', () => {
    const matches = [m('a', 0, 0), m('b', 0, 1)];
    const map = buildArenaMatchNumberById(matches, 2, false);
    expect(map.get('a')).toBe(201);
    expect(map.get('b')).toBe(202);
    for (const x of matches) {
      expect(map.has(x.id)).toBe(true);
    }
  });
});

describe('buildSharedArenaMatchNumberById', () => {
  function mG(
    id: string,
    round: number,
    matchIndex: number,
    groupId: string,
    over: Partial<MatchData> = {}
  ): MatchData {
    return m(id, round, matchIndex, { groupId, ...over });
  }

  it('interleaves rounds across groups A then B on the same arena', () => {
    const matches = [
      ...[0, 1, 2, 3].map((i) => mG(`A-r0-${i}`, 0, i, 'ga')),
      ...[0, 1].map((i) => mG(`A-r1-${i}`, 1, i, 'ga')),
      mG('A-fn', 2, 0, 'ga'),
      ...[0, 1, 2, 3].map((i) => mG(`B-r0-${i}`, 0, i, 'gb')),
      ...[0, 1].map((i) => mG(`B-r1-${i}`, 1, i, 'gb')),
      mG('B-fn', 2, 0, 'gb'),
    ];
    const map = buildSharedArenaMatchNumberById({
      arenaIndex: 1,
      groups: [
        { id: 'ga', thirdPlaceMatch: false },
        { id: 'gb', thirdPlaceMatch: false },
      ],
      matches,
      groupOrder: ['ga', 'gb'],
    });
    expect(map.get('A-r0-0')).toBe(101);
    expect(map.get('A-r0-3')).toBe(104);
    expect(map.get('B-r0-0')).toBe(105);
    expect(map.get('B-r0-3')).toBe(108);
    expect(map.get('A-r1-0')).toBe(109);
    expect(map.get('A-r1-1')).toBe(110);
    expect(map.get('B-r1-0')).toBe(111);
    expect(map.get('B-r1-1')).toBe(112);
    expect(map.get('A-fn')).toBe(113);
    expect(map.get('B-fn')).toBe(114);
    for (const x of matches) {
      expect(map.has(x.id)).toBe(true);
    }
  });

  it('reverses per-round group priority when groupOrder is flipped', () => {
    const matches = [mG('A0', 0, 0, 'ga'), mG('B0', 0, 0, 'gb')];
    const mapAB = buildSharedArenaMatchNumberById({
      arenaIndex: 1,
      groups: [
        { id: 'ga', thirdPlaceMatch: false },
        { id: 'gb', thirdPlaceMatch: false },
      ],
      matches,
      groupOrder: ['ga', 'gb'],
    });
    const mapBA = buildSharedArenaMatchNumberById({
      arenaIndex: 1,
      groups: [
        { id: 'ga', thirdPlaceMatch: false },
        { id: 'gb', thirdPlaceMatch: false },
      ],
      matches,
      groupOrder: ['gb', 'ga'],
    });
    expect(mapAB.get('A0')).toBe(101);
    expect(mapAB.get('B0')).toBe(102);
    expect(mapBA.get('B0')).toBe(101);
    expect(mapBA.get('A0')).toBe(102);
  });

  it('applies manual rank within a round/group bucket before bracket index', () => {
    const matches = [
      mG('a', 0, 0, 'g', { arenaSequenceRank: 2 }),
      mG('b', 0, 1, 'g', { arenaSequenceRank: 1 }),
    ];
    const manual = new Map<string, number>([
      ['a', 2],
      ['b', 1],
    ]);
    const map = buildSharedArenaMatchNumberById({
      arenaIndex: 1,
      groups: [{ id: 'g', thirdPlaceMatch: false }],
      matches,
      groupOrder: ['g'],
      manualRankByMatchId: manual,
    });
    expect(map.get('b')).toBe(101);
    expect(map.get('a')).toBe(102);
  });
});

describe('formatFeederWinnerLabel', () => {
  it('prefixes arena display number', () => {
    expect(formatFeederWinnerLabel(101)).toBe('Winner 101');
  });
});

describe('getFeederMatch', () => {
  it('resolves red and blue feeders like bracket connectors', () => {
    const matches = [m('c0', 0, 0), m('c1', 0, 1), m('p', 1, 0)];
    expect(getFeederMatch(matches, 1, 0, 'red')?.id).toBe('c0');
    expect(getFeederMatch(matches, 1, 0, 'blue')?.id).toBe('c1');
  });
});
