import { describe, expect, it } from 'vitest';
import { planBracketShell } from '../bracket-shape';
import {
  buildConnectorChildLeg,
  buildConnectorChildLegRtl,
  buildConnectorTrunk,
  buildConnectorTrunkRtl,
  buildOneSidedConnectors,
  buildOneSidedLayout,
  buildTwoSidedConnectors,
  buildTwoSidedLayout,
  matchWing,
  roundLabelPlacements,
  twoSidedMatchRowGap,
} from '../bracket-layout';
import type { MatchData } from '@/features/dashboard/types';
import {
  FINAL_FEEDER_EXTRA,
  MATCH_H,
  MATCH_W,
  PADDING,
  ROUND_GAP,
} from '@/config/bracket';

function shellToMatches(
  athleteCount: number,
  thirdPlaceMatch: boolean
): Array<MatchData> {
  const plan = planBracketShell({
    groupId: 'g1',
    tournamentId: 't1',
    athleteCount,
    thirdPlaceMatch,
  });
  return plan.matches.map((m, i) => ({
    id: `m-${i}`,
    kind: 'bracket' as const,
    displayLabel: null,
    round: m.round,
    matchIndex: m.matchIndex,
    status: 'pending' as const,
    redAthleteId: null,
    blueAthleteId: null,
    redTournamentAthleteId: null,
    blueTournamentAthleteId: null,
    redWins: 0,
    blueWins: 0,
    winnerId: null,
    tournamentWinnerId: null,
    redLocked: false,
    blueLocked: false,
    updatedAt: new Date(),
    groupId: 'g1',
    tournamentId: 't1',
  }));
}

describe('roundLabelPlacements', () => {
  it('returns one label per round in one-sided mode', () => {
    const matches = shellToMatches(8, false);
    const { positions, layoutMaxRound } = buildOneSidedLayout(matches, false);
    const placements = roundLabelPlacements(
      positions,
      layoutMaxRound,
      'one-sided'
    );
    expect(placements.length).toBe(layoutMaxRound + 1);
    expect(new Set(placements.map((p) => p.key)).size).toBe(placements.length);
  });
});

describe('twoSidedMatchRowGap', () => {
  it('uses 56px for ≤3 rounds and 40px for larger brackets', () => {
    expect(twoSidedMatchRowGap(2)).toBe(64);
    expect(twoSidedMatchRowGap(3)).toBe(40);
  });
});

describe('matchWing', () => {
  it('partitions an 8-player bracket', () => {
    expect(matchWing(0, 0, 2)).toBe('left');
    expect(matchWing(0, 1, 2)).toBe('left');
    expect(matchWing(0, 2, 2)).toBe('right');
    expect(matchWing(0, 3, 2)).toBe('right');
    expect(matchWing(1, 0, 2)).toBe('left');
    expect(matchWing(1, 1, 2)).toBe('right');
    expect(matchWing(2, 0, 2)).toBe('center');
    expect(matchWing(2, 1, 2)).toBe('center');
  });

  it('partitions a 16-player bracket semifinals', () => {
    expect(matchWing(2, 0, 3)).toBe('left');
    expect(matchWing(2, 1, 3)).toBe('right');
    expect(matchWing(3, 0, 3)).toBe('center');
  });
});

describe('buildTwoSidedLayout', () => {
  it('centers the final and aligns semifinals on the same row', () => {
    const matches = shellToMatches(8, false);
    const { positions } = buildTwoSidedLayout(matches, false);
    const maxRound = 2;
    const final = positions.find(
      (p) => p.match.round === maxRound && p.match.matchIndex === 0
    )!;
    const sfLeft = positions.find(
      (p) => p.match.round === 1 && p.match.matchIndex === 0
    )!;
    const sfRight = positions.find(
      (p) => p.match.round === 1 && p.match.matchIndex === 1
    )!;

    const layoutCenterX = PADDING + maxRound * ROUND_GAP + MATCH_W / 2;
    expect(final.x + MATCH_W / 2).toBeCloseTo(layoutCenterX, 0);
    expect(sfLeft.y).toBeCloseTo(sfRight.y, 0);
    expect(sfLeft.x + MATCH_W).toBeLessThan(final.x);
    expect(sfRight.x).toBeGreaterThan(final.x + MATCH_W);

    const qfLeft = positions.find(
      (p) => p.match.round === 0 && p.match.matchIndex === 0
    )!;
    const qfToSfGap = sfLeft.x - (qfLeft.x + MATCH_W);
    const sfToFinalGap = final.x - (sfLeft.x + MATCH_W);
    expect(sfToFinalGap).toBe(qfToSfGap + FINAL_FEEDER_EXTRA);
  });

  it('places round-0 matches on correct wings', () => {
    const matches = shellToMatches(8, false);
    const { positions } = buildTwoSidedLayout(matches, false);
    const maxRound = 2;
    const layoutCenterX = PADDING + maxRound * ROUND_GAP + MATCH_W / 2;

    for (const p of positions.filter((x) => x.match.round === 0)) {
      const mid = p.x + MATCH_W / 2;
      if (p.wing === 'left') expect(mid).toBeLessThan(layoutCenterX);
      if (p.wing === 'right') expect(mid).toBeGreaterThan(layoutCenterX);
    }
  });

  it('places third-place below final when enabled', () => {
    const matches = shellToMatches(8, true);
    const { positions } = buildTwoSidedLayout(matches, true);
    const final = positions.find(
      (p) =>
        p.wing === 'center' && p.match.matchIndex === 0 && p.match.id !== 'm-7'
    )!;
    const third = positions.find((p) => p.match.id === 'm-7')!;

    expect(third.x).toBe(final.x);
    expect(third.y).toBeGreaterThan(final.y + MATCH_H);
  });

  it('returns empty layout for no matches', () => {
    expect(buildTwoSidedLayout([], false)).toEqual({
      positions: [],
      width: 0,
      height: 0,
      layoutMaxRound: 0,
      thirdPlace: null,
    });
  });

  it('does not treat extra-round third place as final in connectors', () => {
    const matches = shellToMatches(8, true);
    const { positions, layoutMaxRound, thirdPlace } = buildTwoSidedLayout(
      matches,
      true
    );
    expect(thirdPlace).not.toBeNull();
    const paths = buildTwoSidedConnectors(positions, layoutMaxRound);
    const thirdPos = positions.find((p) => p.match.id === thirdPlace!.id)!;
    const finalPos = positions.find(
      (p) => p.match.round === layoutMaxRound && p.match.matchIndex === 0
    )!;

    expect(thirdPos.match.round).toBeGreaterThan(layoutMaxRound);
    const pathsThroughThird = paths.filter((p) => {
      const midX = thirdPos.x + MATCH_W / 2;
      return p.d.includes(String(midX)) && p.d.includes(String(thirdPos.y));
    });
    expect(pathsThroughThird.length).toBe(0);
    expect(finalPos.y).toBeLessThan(thirdPos.y);
  });
});

describe('buildTwoSidedConnectors', () => {
  it('emits paths for left wing, right wing, and final feeders', () => {
    const matches = shellToMatches(8, false);
    const { positions, layoutMaxRound } = buildTwoSidedLayout(matches, false);
    const paths = buildTwoSidedConnectors(positions, layoutMaxRound);
    expect(paths.length).toBeGreaterThan(0);
  });
});

describe('buildOneSidedLayout', () => {
  it('places round-0 matches in the leftmost column', () => {
    const matches = shellToMatches(8, false);
    const { positions } = buildOneSidedLayout(matches, false);
    const r0X = PADDING;
    for (const p of positions.filter((x) => x.match.round === 0)) {
      expect(p.x).toBe(r0X);
      expect(p.wing).toBe('left');
    }
  });

  it('increases x with round toward the final', () => {
    const matches = shellToMatches(8, false);
    const { positions, layoutMaxRound } = buildOneSidedLayout(matches, false);
    const byRound = new Map<number, number>();
    for (const p of positions.filter((m) => m.match.round <= layoutMaxRound)) {
      byRound.set(p.match.round, p.x);
    }
    const xs = [...byRound.entries()]
      .sort((a, b) => a[0] - b[0])
      .map((e) => e[1]);
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i]).toBeGreaterThan(xs[i - 1]!);
    }
  });

  it('centers parent y between feeder mids', () => {
    const matches = shellToMatches(8, false);
    const { positions, layoutMaxRound } = buildOneSidedLayout(matches, false);
    const sf = positions.find(
      (p) => p.match.round === layoutMaxRound - 1 && p.match.matchIndex === 0
    )!;
    const qfA = positions.find(
      (p) => p.match.round === 0 && p.match.matchIndex === 0
    )!;
    const qfB = positions.find(
      (p) => p.match.round === 0 && p.match.matchIndex === 1
    )!;
    const expectedMid =
      (qfA.y + MATCH_H / 2 + (qfB.y + MATCH_H / 2)) / 2 - MATCH_H / 2;
    expect(sf.y).toBeCloseTo(expectedMid, 0);
  });

  it('places third-place below final when enabled', () => {
    const matches = shellToMatches(8, true);
    const { positions, layoutMaxRound } = buildOneSidedLayout(matches, true);
    const final = positions.find(
      (p) => p.match.round === layoutMaxRound && p.match.matchIndex === 0
    )!;
    const third = positions.find((p) => p.match.id === 'm-7')!;

    expect(third.x).toBe(final.x);
    expect(third.y).toBeGreaterThan(final.y + MATCH_H);
    expect(third.wing).toBe('center');
  });

  it('returns empty layout for no matches', () => {
    expect(buildOneSidedLayout([], false)).toEqual({
      positions: [],
      width: 0,
      height: 0,
      layoutMaxRound: 0,
      thirdPlace: null,
    });
  });
});

describe('buildOneSidedConnectors', () => {
  it('emits LTR connector paths including final feeders', () => {
    const matches = shellToMatches(8, false);
    const { positions, layoutMaxRound } = buildOneSidedLayout(matches, false);
    const paths = buildOneSidedConnectors(positions, layoutMaxRound);
    expect(paths.length).toBeGreaterThan(0);
  });

  it('draws a long horizontal trunk into the scaled final', () => {
    const matches = shellToMatches(8, false);
    const { positions, layoutMaxRound } = buildOneSidedLayout(matches, false);
    const final = positions.find(
      (p) => p.match.round === layoutMaxRound && p.match.matchIndex === 0
    )!;
    const sf = positions.find(
      (p) => p.match.round === layoutMaxRound - 1 && p.match.matchIndex === 0
    )!;
    const paths = buildOneSidedConnectors(positions, layoutMaxRound);
    const attachX = final.x - (MATCH_W * (1.2 - 1)) / 2;
    const trunk = paths.find((p) => p.d.includes(`L ${attachX} `));
    expect(trunk).toBeDefined();
    const trunkStart = Number(trunk!.d.match(/M (\d+(?:\.\d+)?) /)?.[1]);
    expect(attachX - trunkStart).toBeGreaterThanOrEqual(24);
    expect(final.x).toBeGreaterThan(sf.x + MATCH_W);
  });
});

describe('buildConnectorChildLeg', () => {
  it('uses a single arc at the child-side corner', () => {
    const d = buildConnectorChildLeg(100, 50, 200, 150, 8);
    expect((d.match(/A /g) ?? []).length).toBe(1);
    expect(d).toMatch(/^M /);
    expect(d).toContain('L 200 150');
  });

  it('falls back to straight line when vertical span negligible', () => {
    const d = buildConnectorChildLeg(100, 50, 200, 50, 8);
    expect(d).toBe('M 100 50 L 200 50');
  });
});

describe('buildConnectorChildLegRtl', () => {
  it('uses a single arc at the child-side corner', () => {
    const d = buildConnectorChildLegRtl(300, 50, 200, 150, 8);
    expect((d.match(/A /g) ?? []).length).toBe(1);
    expect(d).toMatch(/^M /);
  });
});

describe('buildConnectorTrunk', () => {
  it('draws one horizontal segment', () => {
    expect(buildConnectorTrunk(200, 150, 280)).toBe('M 200 150 L 280 150');
  });
});

describe('buildConnectorTrunkRtl', () => {
  it('draws one horizontal segment toward parent right', () => {
    expect(buildConnectorTrunkRtl(200, 150, 120)).toBe('M 200 150 L 120 150');
  });
});
