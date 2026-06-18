import { describe, expect, it } from 'vitest';

import { swapParticipants } from '../swap-participants';
import type { MatchParticipantStore } from '../../repositories/swap-participants';
import {
  BadRequestError,
  NotFoundError,
  PolicyViolationError,
} from '@/server/application/errors';

const baseMatch = {
  id: 'm1',
  kind: 'bracket',
  displayLabel: null,
  groupId: 'g1',
  tournamentId: 't1',
  round: 1,
  matchIndex: 0,
  status: 'pending',
  redAthleteId: 'ap-red',
  blueAthleteId: null,
  redTournamentAthleteId: 'ta-red',
  blueTournamentAthleteId: null,
  redWins: 0,
  blueWins: 0,
  winnerId: null,
  tournamentWinnerId: null,
  redLocked: false,
  blueLocked: false,
  cornersSwapped: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  tournamentStatus: 'draft',
};

const baseResult = { ...baseMatch, cornersSwapped: true };

function fakeStore(match: typeof baseMatch | null = baseMatch) {
  let swapped: unknown = null;

  const store: MatchParticipantStore = {
    findMatch(matchId) {
      return Promise.resolve(match?.id === matchId ? match : null);
    },
    swap(input) {
      swapped = input;
      return Promise.resolve(baseResult);
    },
  };

  return {
    store,
    get swapped() {
      return swapped;
    },
  };
}

const transposePayload = {
  matchId: 'm1',
  redTournamentAthleteId: null,
  blueTournamentAthleteId: 'ta-red',
  adminId: 'admin',
};

describe('swapParticipants use case', () => {
  it('throws NotFoundError when match is missing', async () => {
    const fixture = fakeStore(null);

    await expect(
      swapParticipants(transposePayload, fixture.store)
    ).rejects.toThrow(NotFoundError);

    expect(fixture.swapped).toBeNull();
  });

  it('rejects active tournaments', async () => {
    const fixture = fakeStore({ ...baseMatch, tournamentStatus: 'active' });

    await expect(
      swapParticipants(transposePayload, fixture.store)
    ).rejects.toThrow(PolicyViolationError);

    expect(fixture.swapped).toBeNull();
  });

  it('rejects completed tournaments', async () => {
    const fixture = fakeStore({ ...baseMatch, tournamentStatus: 'completed' });

    await expect(
      swapParticipants(transposePayload, fixture.store)
    ).rejects.toThrow(PolicyViolationError);

    expect(fixture.swapped).toBeNull();
  });

  it('delegates store.swap with activity payload', async () => {
    const fixture = fakeStore();

    await swapParticipants(transposePayload, fixture.store);

    expect(fixture.swapped).toMatchObject({
      command: transposePayload,
      activity: {
        eventType: 'match.swap_participants',
        payload: {
          previousRedAthleteId: 'ta-red',
          previousBlueAthleteId: null,
          redTournamentAthleteId: null,
          blueTournamentAthleteId: 'ta-red',
        },
      },
    });
  });
});

describe('swapParticipants store validation', () => {
  it('rejects non-transpose payloads via BadRequestError', async () => {
    const fixture = fakeStore();
    const store: MatchParticipantStore = {
      ...fixture.store,
      async swap() {
        throw new BadRequestError('Swap must transpose red and blue corners');
      },
    };

    await expect(
      swapParticipants(
        {
          matchId: 'm1',
          redTournamentAthleteId: 'ta-red',
          blueTournamentAthleteId: null,
          adminId: 'admin',
        },
        store
      )
    ).rejects.toThrow(BadRequestError);
  });
});
