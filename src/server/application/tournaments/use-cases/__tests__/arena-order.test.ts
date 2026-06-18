import { describe, expect, it } from 'vitest';

import { moveGroupBetweenArenas, setArenaGroupOrder } from '../arena-order';
import type { TournamentArenaOrderStore } from '../../repositories/arena-order';
import {
  BadRequestError,
  NotFoundError,
  PolicyViolationError,
} from '@/server/application/errors';

const draftTournament = {
  id: 't1',
  status: 'draft',
  arenaGroupOrder: { '1': ['g1', 'g2'], '2': ['g3'] },
  groups: [
    { id: 'g1', arenaIndex: 1 },
    { id: 'g2', arenaIndex: 1 },
    { id: 'g3', arenaIndex: 2 },
  ],
};

function fakeStore(
  tournament: typeof draftTournament | null = draftTournament
) {
  let setOrder: unknown = null;
  let moved: unknown = null;

  const store: TournamentArenaOrderStore = {
    findTournament(tournamentId) {
      return Promise.resolve(
        tournament?.id === tournamentId ? tournament : null
      );
    },
    setArenaGroupOrder(command, loaded) {
      setOrder = { command, loaded };
      return Promise.resolve({ id: loaded.id });
    },
    moveGroupBetweenArenas(command, loaded) {
      moved = { command, loaded };
      return Promise.resolve({ id: loaded.id });
    },
    ensureArenaSlot() {
      return Promise.resolve({ id: 't1' });
    },
    retireArena() {
      return Promise.resolve({ id: 't1' });
    },
  };

  return {
    store,
    get setOrder() {
      return setOrder;
    },
    get moved() {
      return moved;
    },
  };
}

describe('tournament arena order use cases', () => {
  it('setArenaGroupOrder throws NotFoundError when tournament is missing', async () => {
    const fixture = fakeStore(null);

    await expect(
      setArenaGroupOrder(
        { tournamentId: 't1', arenaIndex: 1, groupIds: ['g1', 'g2'] },
        fixture.store
      )
    ).rejects.toThrow(NotFoundError);

    expect(fixture.setOrder).toBeNull();
  });

  it('setArenaGroupOrder rejects non-draft tournaments', async () => {
    const fixture = fakeStore({ ...draftTournament, status: 'active' });

    await expect(
      setArenaGroupOrder(
        { tournamentId: 't1', arenaIndex: 1, groupIds: ['g1', 'g2'] },
        fixture.store
      )
    ).rejects.toThrow(PolicyViolationError);

    expect(fixture.setOrder).toBeNull();
  });

  it('setArenaGroupOrder requires every group on the arena exactly once', async () => {
    const fixture = fakeStore();

    await expect(
      setArenaGroupOrder(
        { tournamentId: 't1', arenaIndex: 1, groupIds: ['g1'] },
        fixture.store
      )
    ).rejects.toThrow(BadRequestError);

    await expect(
      setArenaGroupOrder(
        { tournamentId: 't1', arenaIndex: 1, groupIds: ['g1', 'g3'] },
        fixture.store
      )
    ).rejects.toThrow(/exactly once/);

    expect(fixture.setOrder).toBeNull();
  });

  it('setArenaGroupOrder delegates to the store after validation', async () => {
    const fixture = fakeStore();

    await setArenaGroupOrder(
      { tournamentId: 't1', arenaIndex: 1, groupIds: ['g2', 'g1'] },
      fixture.store
    );

    expect(fixture.setOrder).toMatchObject({
      command: {
        tournamentId: 't1',
        arenaIndex: 1,
        groupIds: ['g2', 'g1'],
      },
    });
  });

  it('moveGroupBetweenArenas rejects same-arena moves', async () => {
    const fixture = fakeStore();

    await expect(
      moveGroupBetweenArenas(
        {
          tournamentId: 't1',
          groupId: 'g2',
          fromArena: 1,
          toArena: 1,
          insertIndex: 0,
        },
        fixture.store
      )
    ).rejects.toThrow(BadRequestError);

    expect(fixture.moved).toBeNull();
  });

  it('moveGroupBetweenArenas delegates to the store after validation', async () => {
    const fixture = fakeStore();

    await moveGroupBetweenArenas(
      {
        tournamentId: 't1',
        groupId: 'g2',
        fromArena: 1,
        toArena: 2,
        insertIndex: 1,
      },
      fixture.store
    );

    expect(fixture.moved).toMatchObject({
      command: {
        groupId: 'g2',
        fromArena: 1,
        toArena: 2,
        insertIndex: 1,
      },
    });
  });
});
