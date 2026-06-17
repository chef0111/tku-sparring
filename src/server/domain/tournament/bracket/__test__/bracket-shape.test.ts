import { describe, expect, it } from 'vitest';

import { planBracketShell, planRound0Placements } from '../bracket-shape';

describe('planBracketShell', () => {
  it('creates one round-0 match for two athletes', () => {
    const plan = planBracketShell({
      groupId: 'g1',
      tournamentId: 't1',
      athleteCount: 2,
      thirdPlaceMatch: false,
    });

    expect(plan.bracketSize).toBe(2);
    expect(plan.matches).toEqual([
      expect.objectContaining({
        round: 0,
        matchIndex: 0,
        groupId: 'g1',
        tournamentId: 't1',
      }),
    ]);
  });

  it('adds a Third-Place Match only when enabled and athlete count is at least four', () => {
    const withoutEnoughAthletes = planBracketShell({
      groupId: 'g1',
      tournamentId: 't1',
      athleteCount: 3,
      thirdPlaceMatch: true,
    });
    const withEnoughAthletes = planBracketShell({
      groupId: 'g1',
      tournamentId: 't1',
      athleteCount: 4,
      thirdPlaceMatch: true,
    });

    expect(withoutEnoughAthletes.matches).toHaveLength(3);
    expect(withEnoughAthletes.matches).toContainEqual(
      expect.objectContaining({ round: 2, matchIndex: 0 })
    );
  });
});

describe('planRound0Placements', () => {
  const athletes = ['ta1', 'ta2', 'ta3', 'ta4', 'ta5'].map((id, ix) => ({
    id,
    athleteProfileId: `ap${ix + 1}`,
  }));

  it('plans 5 athletes into 4 opening matches with no both-empty match', () => {
    const plan = planRound0Placements({
      bracketSize: 8,
      athletes,
      round0Matches: [0, 1, 2, 3].map((matchIndex) => ({
        id: `r0-${matchIndex}`,
        matchIndex,
        redLocked: false,
        blueLocked: false,
        redTournamentAthleteId: null,
        blueTournamentAthleteId: null,
        redAthleteId: null,
        blueAthleteId: null,
      })),
      shuffledAthletes: athletes,
    });

    const occupancy = plan.updates.map((u) => [
      u.data.redTournamentAthleteId != null,
      u.data.blueTournamentAthleteId != null,
    ]);

    expect(occupancy.filter(([r, b]) => r && b)).toHaveLength(1);
    expect(occupancy.filter(([r, b]) => r !== b)).toHaveLength(3);
    expect(occupancy.filter(([r, b]) => !r && !b)).toHaveLength(0);
  });

  it('preserves locked red athlete placement', () => {
    const plan = planRound0Placements({
      bracketSize: 4,
      athletes: [
        { id: 'ta-locked', athleteProfileId: 'p1' },
        { id: 'ta-a', athleteProfileId: 'p2' },
        { id: 'ta-b', athleteProfileId: 'p3' },
      ],
      round0Matches: [
        {
          id: 'm0',
          matchIndex: 0,
          redLocked: true,
          blueLocked: false,
          redTournamentAthleteId: 'ta-locked',
          blueTournamentAthleteId: null,
          redAthleteId: 'apx',
          blueAthleteId: null,
        },
        {
          id: 'm1',
          matchIndex: 1,
          redLocked: false,
          blueLocked: false,
          redTournamentAthleteId: null,
          blueTournamentAthleteId: null,
          redAthleteId: null,
          blueAthleteId: null,
        },
      ],
      shuffledAthletes: [
        { id: 'ta-a', athleteProfileId: 'p2' },
        { id: 'ta-b', athleteProfileId: 'p3' },
      ],
    });

    const m0 = plan.updates.find((u) => u.matchId === 'm0');
    expect(m0?.data).toMatchObject({
      redTournamentAthleteId: 'ta-locked',
      redAthleteId: 'apx',
    });
  });
});
