import { describe, expect, it } from 'vitest';

import {
  assignAthleteToGroup,
  autoAssignAllEligible,
  autoAssignGroup,
} from '../assign';
import type { GroupAssignmentStore } from '../../repositories/assign';
import { BadRequestError, NotFoundError } from '@/server/application/errors';

const baseGroup = {
  id: 'g1',
  tournamentId: 't1',
  tournamentStatus: 'draft',
  gender: null,
  beltMin: null,
  beltMax: null,
  weightMin: null,
  weightMax: null,
};

function fakeStore(over: Partial<GroupAssignmentStore> = {}) {
  let assigned = 0;
  let autoAssigned = 0;

  const store: GroupAssignmentStore = {
    findGroup(groupId) {
      return Promise.resolve(groupId === 'g1' ? baseGroup : null);
    },
    findTournamentAthlete(id) {
      return Promise.resolve(
        id === 'ta1' ? { id: 'ta1', tournamentId: 't1' } : null
      );
    },
    assignAthlete(command) {
      assigned += 1;
      return Promise.resolve({
        id: command.tournamentAthleteId,
        tournamentId: 't1',
        groupId: command.groupId,
        name: 'Ada',
        status: 'assigned',
      });
    },
    unassignAthlete(command) {
      return Promise.resolve({
        id: command.tournamentAthleteId,
        tournamentId: 't1',
        groupId: null,
        name: 'Ada',
        status: 'selected',
      });
    },
    autoAssign() {
      autoAssigned += 1;
      return Promise.resolve({ assigned: 2 });
    },
    autoAssignAll() {
      return Promise.resolve({ assigned: 2, groupsRun: 1, groupsSkipped: 1 });
    },
    findTournament(tournamentId) {
      return Promise.resolve(
        tournamentId === 't1' ? { status: 'draft' } : null
      );
    },
    ...over,
  };

  return {
    store,
    get assigned() {
      return assigned;
    },
    get autoAssigned() {
      return autoAssigned;
    },
  };
}

describe('group assignment use cases', () => {
  it('assignAthleteToGroup rejects cross-tournament athletes', async () => {
    const fixture = fakeStore({
      findTournamentAthlete() {
        return Promise.resolve({ id: 'ta1', tournamentId: 't2' });
      },
    });

    await expect(
      assignAthleteToGroup(
        {
          groupId: 'g1',
          tournamentAthleteId: 'ta1',
          adminId: 'admin-1',
        },
        fixture.store
      )
    ).rejects.toThrow(BadRequestError);

    expect(fixture.assigned).toBe(0);
  });

  it('assignAthleteToGroup delegates store.assignAthlete', async () => {
    const fixture = fakeStore();

    await assignAthleteToGroup(
      {
        groupId: 'g1',
        tournamentAthleteId: 'ta1',
        adminId: 'admin-1',
      },
      fixture.store
    );

    expect(fixture.assigned).toBe(1);
  });

  it('autoAssignGroup throws NotFoundError when group is missing', async () => {
    const fixture = fakeStore({
      findGroup() {
        return Promise.resolve(null);
      },
    });

    await expect(
      autoAssignGroup(
        { tournamentId: 't1', groupId: 'missing', adminId: 'admin-1' },
        fixture.store
      )
    ).rejects.toThrow(NotFoundError);
  });

  it('autoAssignAllEligible delegates store.autoAssignAll', async () => {
    const fixture = fakeStore();

    const result = await autoAssignAllEligible(
      { tournamentId: 't1', adminId: 'admin-1' },
      fixture.store
    );

    expect(result).toEqual({ assigned: 2, groupsRun: 1, groupsSkipped: 1 });
  });
});
