import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdvanceSettingsDAL, deriveGroupStatusForSelectionView } from '../dal';
import { formatArenaMatchTitle } from '@/lib/tournament/arena-match-label';
import { loadMatchLabelContext } from '@/lib/tournament/match-label-context';
import { ArenaMatchClaimDAL } from '@/orpc/arena-match-claim/dal';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    group: {
      findUnique: vi.fn(),
    },
    match: {
      findMany: vi.fn(),
    },
    tournament: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    tournamentAthlete: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/tournament/match-label-context', () => ({
  loadMatchLabelContext: vi.fn(),
}));

vi.mock('@/orpc/arena-match-claim/dal', () => ({
  ArenaMatchClaimDAL: {
    activeClaimsByMatchId: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('deriveGroupStatusForSelectionView', () => {
  it('marks completed when tournament is completed', () => {
    expect(deriveGroupStatusForSelectionView('completed', [])).toBe(
      'completed'
    );
    expect(deriveGroupStatusForSelectionView('completed', ['pending'])).toBe(
      'completed'
    );
  });

  it('draft when tournament is draft and group has no matches', () => {
    expect(deriveGroupStatusForSelectionView('draft', [])).toBe('draft');
  });

  it('completed when all matches are complete', () => {
    expect(
      deriveGroupStatusForSelectionView('active', ['complete', 'complete'])
    ).toBe('completed');
  });

  it('active when tournament is active and matches remain', () => {
    expect(
      deriveGroupStatusForSelectionView('active', ['complete', 'pending'])
    ).toBe('active');
  });
});

describe('Advance Settings match labels', () => {
  it('uses Match {n} title from arena display number', () => {
    expect(formatArenaMatchTitle(101)).toBe('Match 101');
  });
});

describe('AdvanceSettingsDAL.selectionCatalog', () => {
  it('includes tournament and group rows in expected order', async () => {
    vi.mocked(prisma.tournament.findMany).mockResolvedValue([
      { id: 't2', name: 'Second', status: 'active' },
      { id: 't1', name: 'First', status: 'active' },
    ] as never);
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      id: 't1',
      status: 'active',
      arenaGroupOrder: null,
      groups: [
        {
          id: 'g1',
          name: 'Group 1',
          tournamentId: 't1',
          arenaIndex: 1,
          thirdPlaceMatch: false,
        },
        {
          id: 'g2',
          name: 'Group 2',
          tournamentId: 't1',
          arenaIndex: 2,
          thirdPlaceMatch: false,
        },
      ],
    } as never);
    vi.mocked(prisma.match.findMany).mockResolvedValue([
      { groupId: 'g1', status: 'complete' },
      { groupId: 'g2', status: 'pending' },
    ] as never);

    const result = await AdvanceSettingsDAL.selectionCatalog({
      deviceId: 'd1',
      tournamentId: 't1',
    });

    expect(result.tournaments.map((row) => row.id)).toEqual(['t2', 't1']);
    expect(result.groups.map((row) => row.id)).toEqual(['g1', 'g2']);
    expect(result.groups).toEqual([
      expect.objectContaining({
        id: 'g1',
        status: 'completed',
        arenaLabel: 'Arena 1',
      }),
      expect.objectContaining({
        id: 'g2',
        status: 'active',
        arenaLabel: 'Arena 2',
      }),
    ]);
  });
});

describe('AdvanceSettingsDAL.selectionMatches', () => {
  it('includes claim status for this device and other devices', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue({
      tournamentId: 't1',
    } as never);
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      id: 't1',
      status: 'active',
      arenaGroupOrder: null,
      groups: [
        {
          id: 'g1',
          name: 'Group 1',
          tournamentId: 't1',
          arenaIndex: 1,
          thirdPlaceMatch: false,
        },
      ],
    } as never);
    vi.mocked(loadMatchLabelContext).mockResolvedValue({
      arenaIndex: 1,
      groupIdsOnArena: ['g1'],
      allMatches: [
        {
          id: 'm1',
          kind: 'bracket',
          displayLabel: null,
          groupId: 'g1',
          status: 'pending',
          redTournamentAthleteId: 'ta-red',
          blueTournamentAthleteId: 'ta-blue',
        },
        {
          id: 'm2',
          kind: 'custom',
          displayLabel: 'Custom final',
          groupId: 'g1',
          status: 'active',
          redTournamentAthleteId: 'ta-c',
          blueTournamentAthleteId: 'ta-d',
        },
      ],
      numbers: new Map<string, number | null>([['m1', 101]]),
      assignedBracketTitleKeys: new Set(),
    } as never);
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([
      { id: 'ta-red', name: 'Red', image: ' red.png ' },
      { id: 'ta-blue', name: 'Blue', image: null },
      { id: 'ta-c', name: 'Custom Red', image: null },
      { id: 'ta-d', name: 'Custom Blue', image: null },
    ] as never);
    vi.mocked(ArenaMatchClaimDAL.activeClaimsByMatchId).mockResolvedValue(
      new Map([
        ['m1', { deviceId: 'd1' }],
        ['m2', { deviceId: 'other-device' }],
      ])
    );

    const result = await AdvanceSettingsDAL.selectionMatches({
      deviceId: 'd1',
      tournamentId: 't1',
      groupId: 'g1',
    });

    expect(result.matches).toEqual([
      expect.objectContaining({
        id: 'm1',
        label: 'Match 101',
        claimStatus: 'held_by_me',
        disabled: false,
        redAthleteImage: 'red.png',
      }),
      expect.objectContaining({
        id: 'm2',
        label: 'Custom final',
        claimStatus: 'held_by_other',
        disabled: true,
      }),
    ]);
  });
});
