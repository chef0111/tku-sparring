import { describe, expect, it } from 'vitest';

import { createGroup, deleteGroup, updateGroup } from '../lifecycle';
import type { GroupLifecycleStore } from '../../repositories/lifecycle';
import {
  NotFoundError,
  PolicyViolationError,
} from '@/server/application/errors';

const baseGroup = {
  id: 'g1',
  tournamentId: 't1',
  tournamentStatus: 'draft',
};

const baseRow = {
  id: 'g1',
  name: 'Group A',
  tournamentId: 't1',
  gender: null,
  beltMin: null,
  beltMax: null,
  weightMin: null,
  weightMax: null,
  thirdPlaceMatch: false,
  arenaIndex: 1,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

function fakeStore(
  tournament: { status: string } | null = { status: 'draft' },
  group: typeof baseGroup | null = baseGroup
) {
  let created: unknown = null;
  let updated: unknown = null;
  let deleted: unknown = null;

  const store: GroupLifecycleStore = {
    findTournament(tournamentId) {
      return Promise.resolve(tournamentId === 't1' ? tournament : null);
    },
    findGroup(id) {
      return Promise.resolve(group?.id === id ? group : null);
    },
    create(command) {
      created = command;
      return Promise.resolve(baseRow);
    },
    update(command) {
      updated = command;
      return Promise.resolve({ ...baseRow, ...command });
    },
    delete(command) {
      deleted = command;
      return Promise.resolve(baseRow);
    },
  };

  return {
    store,
    get created() {
      return created;
    },
    get updated() {
      return updated;
    },
    get deleted() {
      return deleted;
    },
  };
}

describe('group lifecycle use cases', () => {
  it('createGroup throws NotFoundError when tournament is missing', async () => {
    const fixture = fakeStore(null);

    await expect(
      createGroup({ name: 'Group A', tournamentId: 't1' }, fixture.store)
    ).rejects.toThrow(NotFoundError);

    expect(fixture.created).toBeNull();
  });

  it('createGroup rejects non-draft tournaments', async () => {
    const fixture = fakeStore({ status: 'active' });

    await expect(
      createGroup({ name: 'Group A', tournamentId: 't1' }, fixture.store)
    ).rejects.toThrow(PolicyViolationError);

    expect(fixture.created).toBeNull();
  });

  it('createGroup delegates store.create', async () => {
    const fixture = fakeStore();

    await createGroup({ name: 'Group A', tournamentId: 't1' }, fixture.store);

    expect(fixture.created).toEqual({ name: 'Group A', tournamentId: 't1' });
  });

  it('updateGroup throws NotFoundError when group is missing', async () => {
    const fixture = fakeStore({ status: 'draft' }, null);

    await expect(
      updateGroup({ id: 'g1', name: 'Group B' }, fixture.store)
    ).rejects.toThrow(NotFoundError);

    expect(fixture.updated).toBeNull();
  });

  it('updateGroup rejects completed tournaments', async () => {
    const fixture = fakeStore(
      { status: 'draft' },
      { ...baseGroup, tournamentStatus: 'completed' }
    );

    await expect(
      updateGroup({ id: 'g1', name: 'Group B' }, fixture.store)
    ).rejects.toThrow(PolicyViolationError);

    expect(fixture.updated).toBeNull();
  });

  it('deleteGroup rejects non-draft tournaments', async () => {
    const fixture = fakeStore(
      { status: 'draft' },
      { ...baseGroup, tournamentStatus: 'active' }
    );

    await expect(deleteGroup({ id: 'g1' }, fixture.store)).rejects.toThrow(
      PolicyViolationError
    );

    expect(fixture.deleted).toBeNull();
  });
});
