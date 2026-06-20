import { describe, expect, it } from 'vitest';

import {
  adminSetMatchStatus,
  setMatchWinner,
  updateMatchScore,
} from '../transition';
import type {
  MatchTransitionRow,
  MatchTransitionStore,
} from '../../repositories/transition';
import {
  NotFoundError,
  PolicyViolationError,
} from '@/server/application/errors';

type ApplyInput = Parameters<MatchTransitionStore['applyTransition']>[0];

const baseMatch: MatchTransitionRow = {
  id: 'm1',
  kind: 'bracket',
  displayLabel: null,
  round: 0,
  matchIndex: 0,
  status: 'active',
  redAthleteId: 'ap-red',
  blueAthleteId: 'ap-blue',
  redTournamentAthleteId: 'ta-red',
  blueTournamentAthleteId: 'ta-blue',
  redWins: 0,
  blueWins: 0,
  winnerId: null,
  tournamentWinnerId: null,
  redLocked: false,
  blueLocked: false,
  cornersSwapped: false,
  divisionId: 'g1',
  tournamentId: 't1',
  tournamentStatus: 'active',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

function fakeStore(match: MatchTransitionRow = baseMatch) {
  let applied: ApplyInput | null = null;

  const store: MatchTransitionStore = {
    findMatch(matchId) {
      return Promise.resolve(match.id === matchId ? match : null);
    },
    applyTransition(input) {
      applied = input;
      return Promise.resolve({ ...match, ...input.plan.data });
    },
  };

  return {
    store,
    get applied() {
      return applied;
    },
  };
}

describe('match transition use cases', () => {
  it('updateMatchScore throws NotFoundError when match is missing', async () => {
    const fixture = fakeStore();

    await expect(
      updateMatchScore(
        { matchId: 'missing', redWins: 1, blueWins: 0, adminId: 'admin-1' },
        fixture.store
      )
    ).rejects.toThrow(NotFoundError);

    expect(fixture.applied).toBeNull();
  });

  it('updateMatchScore builds match.score_edit activity', async () => {
    const fixture = fakeStore();

    await updateMatchScore(
      { matchId: 'm1', redWins: 2, blueWins: 0, adminId: 'admin-1' },
      fixture.store
    );

    expect(fixture.applied).toMatchObject({
      matchId: 'm1',
      adminId: 'admin-1',
      activity: {
        eventType: 'match.score_edit',
        payload: {
          redWins: 2,
          blueWins: 0,
          status: 'complete',
        },
      },
      plan: {
        data: {
          redWins: 2,
          blueWins: 0,
          winnerId: 'ap-red',
          tournamentWinnerId: 'ta-red',
          status: 'complete',
        },
        advancedWinnerId: 'ta-red',
      },
    });
  });

  it('setMatchWinner builds match.winner_override activity', async () => {
    const fixture = fakeStore();

    await setMatchWinner(
      {
        matchId: 'm1',
        winnerSide: 'blue',
        reason: 'judge correction',
        adminId: 'admin-1',
      },
      fixture.store
    );

    expect(fixture.applied).toMatchObject({
      matchId: 'm1',
      adminId: 'admin-1',
      activity: {
        eventType: 'match.winner_override',
        payload: {
          winnerSide: 'blue',
          reason: 'judge correction',
        },
      },
      plan: {
        data: {
          winnerId: 'ap-blue',
          tournamentWinnerId: 'ta-blue',
          status: 'complete',
        },
        advancedWinnerId: 'ta-blue',
      },
    });
  });

  it('updateMatchScore rejects completed tournaments', async () => {
    const fixture = fakeStore({ ...baseMatch, tournamentStatus: 'completed' });

    await expect(
      updateMatchScore(
        { matchId: 'm1', redWins: 1, blueWins: 0, adminId: 'admin-1' },
        fixture.store
      )
    ).rejects.toThrow(PolicyViolationError);

    expect(fixture.applied).toBeNull();
  });

  it('setMatchWinner rejects completed tournaments', async () => {
    const fixture = fakeStore({ ...baseMatch, tournamentStatus: 'completed' });

    await expect(
      setMatchWinner(
        {
          matchId: 'm1',
          winnerSide: 'red',
          adminId: 'admin-1',
        },
        fixture.store
      )
    ).rejects.toThrow(PolicyViolationError);

    expect(fixture.applied).toBeNull();
  });

  it('adminSetMatchStatus rejects completed tournaments', async () => {
    const fixture = fakeStore({ ...baseMatch, tournamentStatus: 'completed' });

    await expect(
      adminSetMatchStatus(
        { matchId: 'm1', status: 'active', adminId: 'admin-1' },
        fixture.store
      )
    ).rejects.toThrow(PolicyViolationError);

    expect(fixture.applied).toBeNull();
  });

  it('adminSetMatchStatus builds match.status_admin activity with clearedScores', async () => {
    const fixture = fakeStore({
      ...baseMatch,
      status: 'complete',
      redWins: 2,
      blueWins: 0,
      winnerId: 'ap-red',
      tournamentWinnerId: 'ta-red',
    });

    await adminSetMatchStatus(
      { matchId: 'm1', status: 'active', adminId: 'admin-1' },
      fixture.store
    );

    expect(fixture.applied).toMatchObject({
      matchId: 'm1',
      adminId: 'admin-1',
      activity: {
        eventType: 'match.status_admin',
        payload: {
          fromStatus: 'complete',
          toStatus: 'active',
          clearedScores: true,
        },
      },
      plan: {
        data: {
          status: 'active',
          redWins: 0,
          blueWins: 0,
          winnerId: null,
          tournamentWinnerId: null,
        },
        clearAdvancement: true,
      },
    });
  });
});
