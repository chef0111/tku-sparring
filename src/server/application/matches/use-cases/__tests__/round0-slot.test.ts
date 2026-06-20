import { describe, expect, it } from 'vitest';

import { assignSlot, setLock, swapSlots } from '../round0-slot';
import type { Round0SlotStore } from '../../repositories/round0-slot';
import {
  NotFoundError,
  PolicyViolationError,
} from '@/server/application/errors';

const baseMatch = {
  id: 'm1',
  kind: 'bracket',
  displayLabel: null,
  divisionId: 'g1',
  tournamentId: 't1',
  round: 0,
  matchIndex: 0,
  status: 'pending',
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
  cornersSwapped: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  tournamentStatus: 'draft',
};

const baseResult = { ...baseMatch };

function fakeStore(match: typeof baseMatch | null = baseMatch) {
  let locked: unknown = null;
  let assigned: unknown = null;
  let swapped: unknown = null;

  const store: Round0SlotStore = {
    findMatch(matchId) {
      return Promise.resolve(match?.id === matchId ? match : null);
    },
    setLock(command) {
      locked = command;
      return Promise.resolve(baseResult);
    },
    assignSlot(command) {
      assigned = command;
      return Promise.resolve(baseResult);
    },
    swapSlots(command) {
      swapped = command;
      return Promise.resolve(baseResult);
    },
  };

  return {
    store,
    get locked() {
      return locked;
    },
    get assigned() {
      return assigned;
    },
    get swapped() {
      return swapped;
    },
  };
}

describe('round0 slot use cases', () => {
  it('setLock throws NotFoundError when match is missing', async () => {
    const fixture = fakeStore(null);

    await expect(
      setLock({ matchId: 'm1', side: 'red', locked: true }, fixture.store)
    ).rejects.toThrow(NotFoundError);

    expect(fixture.locked).toBeNull();
  });

  it('setLock rejects active tournaments', async () => {
    const fixture = fakeStore({ ...baseMatch, tournamentStatus: 'active' });

    await expect(
      setLock({ matchId: 'm1', side: 'red', locked: true }, fixture.store)
    ).rejects.toThrow(PolicyViolationError);

    expect(fixture.locked).toBeNull();
  });

  it('setLock delegates store.setLock', async () => {
    const fixture = fakeStore();

    await setLock(
      { matchId: 'm1', side: 'blue', locked: false },
      fixture.store
    );

    expect(fixture.locked).toEqual({
      matchId: 'm1',
      side: 'blue',
      locked: false,
    });
  });

  it('assignSlot throws NotFoundError when match is missing', async () => {
    const fixture = fakeStore(null);

    await expect(
      assignSlot(
        {
          matchId: 'm1',
          side: 'red',
          tournamentAthleteId: 'ta1',
          adminId: 'admin',
        },
        fixture.store
      )
    ).rejects.toThrow(NotFoundError);

    expect(fixture.assigned).toBeNull();
  });

  it('assignSlot delegates store.assignSlot', async () => {
    const fixture = fakeStore();

    await assignSlot(
      {
        matchId: 'm1',
        side: 'red',
        tournamentAthleteId: 'ta1',
        adminId: 'admin',
      },
      fixture.store
    );

    expect(fixture.assigned).toMatchObject({
      matchId: 'm1',
      side: 'red',
      tournamentAthleteId: 'ta1',
      adminId: 'admin',
    });
  });

  it('swapSlots delegates store.swapSlots', async () => {
    const fixture = fakeStore();

    await swapSlots(
      {
        matchAId: 'm1',
        sideA: 'red',
        matchBId: 'mb',
        sideB: 'blue',
        adminId: 'admin',
      },
      fixture.store
    );

    expect(fixture.swapped).toMatchObject({
      matchAId: 'm1',
      sideA: 'red',
      matchBId: 'mb',
      sideB: 'blue',
      adminId: 'admin',
    });
  });
});
