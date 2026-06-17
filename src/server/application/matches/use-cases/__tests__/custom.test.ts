import { describe, expect, it } from 'vitest';

import { createCustomMatch, deleteCustomMatch } from '../custom';
import type {
  CustomMatchDeleteContext,
  CustomMatchGroupContext,
  CustomMatchResult,
  CustomMatchStore,
} from '../../repositories/custom';
import {
  BadRequestError,
  NotFoundError,
  PolicyViolationError,
} from '@/server/application/errors';

type CreateInput = Parameters<CustomMatchStore['create']>[0];
type DeleteInput = Parameters<CustomMatchStore['delete']>[0];

const baseGroup: CustomMatchGroupContext = {
  id: 'g1',
  tournamentId: 't1',
  tournamentStatus: 'active',
};

const baseDeleteContext: CustomMatchDeleteContext = {
  id: 'm1',
  kind: 'custom',
  displayLabel: 'Exhibition',
  groupId: 'g1',
  tournamentId: 't1',
  tournamentStatus: 'active',
};

const baseResult: CustomMatchResult = {
  id: 'm1',
  kind: 'custom',
  displayLabel: 'Exhibition',
  groupId: 'g1',
  tournamentId: 't1',
  round: 900,
  matchIndex: 0,
  status: 'pending',
  redAthleteId: 'ap-r',
  blueAthleteId: 'ap-b',
  redTournamentAthleteId: 'ta-r',
  blueTournamentAthleteId: 'ta-b',
  redWins: 0,
  blueWins: 0,
  winnerId: null,
  tournamentWinnerId: null,
  redLocked: false,
  blueLocked: false,
  cornersSwapped: false,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

function fakeStore(
  group: CustomMatchGroupContext | null = baseGroup,
  deleteContext: CustomMatchDeleteContext | null = baseDeleteContext
) {
  let created: CreateInput | null = null;
  let deleted: DeleteInput | null = null;

  const store: CustomMatchStore = {
    findGroup(groupId) {
      return Promise.resolve(group?.id === groupId ? group : null);
    },
    findForDelete(matchId) {
      return Promise.resolve(
        deleteContext?.id === matchId ? deleteContext : null
      );
    },
    create(input) {
      created = input;
      return Promise.resolve(baseResult);
    },
    delete(input) {
      deleted = input;
      return Promise.resolve(baseResult);
    },
  };

  return {
    store,
    get created() {
      return created;
    },
    get deleted() {
      return deleted;
    },
  };
}

describe('custom match use cases', () => {
  it('createCustomMatch throws NotFoundError when group is missing', async () => {
    const fixture = fakeStore(null);

    await expect(
      createCustomMatch(
        {
          groupId: 'missing',
          displayLabel: 'Exhibition',
          red: { mode: 'direct', tournamentAthleteId: 'ta-r' },
          blue: { mode: 'direct', tournamentAthleteId: 'ta-b' },
          adminId: 'admin-1',
        },
        fixture.store
      )
    ).rejects.toThrow(NotFoundError);

    expect(fixture.created).toBeNull();
  });

  it('createCustomMatch rejects completed tournaments', async () => {
    const fixture = fakeStore({
      ...baseGroup,
      tournamentStatus: 'completed',
    });

    await expect(
      createCustomMatch(
        {
          groupId: 'g1',
          displayLabel: 'Exhibition',
          red: { mode: 'direct', tournamentAthleteId: 'ta-r' },
          blue: { mode: 'direct', tournamentAthleteId: 'ta-b' },
          adminId: 'admin-1',
        },
        fixture.store
      )
    ).rejects.toThrow(PolicyViolationError);

    expect(fixture.created).toBeNull();
  });

  it('createCustomMatch delegates store.create with match.create_custom activity', async () => {
    const fixture = fakeStore();

    await createCustomMatch(
      {
        groupId: 'g1',
        displayLabel: ' Exhibition ',
        red: { mode: 'direct', tournamentAthleteId: 'ta-r' },
        blue: { mode: 'direct', tournamentAthleteId: 'ta-b' },
        adminId: 'admin-1',
      },
      fixture.store
    );

    expect(fixture.created).toMatchObject({
      command: expect.objectContaining({
        groupId: 'g1',
        displayLabel: ' Exhibition ',
        adminId: 'admin-1',
      }),
      group: baseGroup,
      activity: {
        eventType: 'match.create_custom',
        payload: {
          groupId: 'g1',
          displayLabel: 'Exhibition',
        },
      },
    });
  });

  it('deleteCustomMatch throws NotFoundError when match is missing', async () => {
    const fixture = fakeStore(baseGroup, null);

    await expect(
      deleteCustomMatch(
        { matchId: 'missing', adminId: 'admin-1' },
        fixture.store
      )
    ).rejects.toThrow(NotFoundError);

    expect(fixture.deleted).toBeNull();
  });

  it('deleteCustomMatch throws BadRequestError for non-custom matches', async () => {
    const fixture = fakeStore(baseGroup, {
      ...baseDeleteContext,
      kind: 'bracket',
    });

    await expect(
      deleteCustomMatch({ matchId: 'm1', adminId: 'admin-1' }, fixture.store)
    ).rejects.toThrow(BadRequestError);

    expect(fixture.deleted).toBeNull();
  });

  it('deleteCustomMatch rejects completed tournaments', async () => {
    const fixture = fakeStore(baseGroup, {
      ...baseDeleteContext,
      tournamentStatus: 'completed',
    });

    await expect(
      deleteCustomMatch({ matchId: 'm1', adminId: 'admin-1' }, fixture.store)
    ).rejects.toThrow(PolicyViolationError);

    expect(fixture.deleted).toBeNull();
  });

  it('deleteCustomMatch delegates store.delete with match.delete_custom activity', async () => {
    const fixture = fakeStore();

    await deleteCustomMatch(
      { matchId: 'm1', adminId: 'admin-1' },
      fixture.store
    );

    expect(fixture.deleted).toMatchObject({
      matchId: 'm1',
      adminId: 'admin-1',
      activity: {
        eventType: 'match.delete_custom',
        payload: {
          groupId: 'g1',
          displayLabel: 'Exhibition',
        },
      },
    });
  });
});
