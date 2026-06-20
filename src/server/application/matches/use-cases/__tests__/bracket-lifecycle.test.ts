import { describe, expect, it } from 'vitest';

import {
  generateBracket,
  regenerateBracket,
  resetBracket,
  shuffleBracket,
} from '../bracket-lifecycle';
import type { BracketLifecycleStore } from '../../repositories/bracket-lifecycle';
import {
  BadRequestError,
  NotFoundError,
  PolicyViolationError,
} from '@/server/application/errors';

const baseGroup = {
  id: 'g1',
  tournamentId: 't1',
  tournamentStatus: 'draft',
  thirdPlaceMatch: false,
  round0Baseline: null,
};

const baseMatches = [{ id: 'm1' }] as never;

function fakeStore(
  group: typeof baseGroup | null = baseGroup,
  bracketCount = 0
) {
  let generated: unknown = null;
  let shuffled: unknown = null;
  let reset: unknown = null;
  let regenerated: unknown = null;

  const store: BracketLifecycleStore = {
    findDivision(divisionId) {
      return Promise.resolve(group?.id === divisionId ? group : null);
    },
    countBracketMatches(divisionId) {
      return Promise.resolve(divisionId === 'g1' ? bracketCount : 0);
    },
    generate(input) {
      generated = input;
      return Promise.resolve(baseMatches);
    },
    shuffle(input) {
      shuffled = input;
      return Promise.resolve(baseMatches);
    },
    reset(input) {
      reset = input;
      return Promise.resolve(baseMatches);
    },
    regenerate(input) {
      regenerated = input;
      return Promise.resolve(baseMatches);
    },
  };

  return {
    store,
    get generated() {
      return generated;
    },
    get shuffled() {
      return shuffled;
    },
    get reset() {
      return reset;
    },
    get regenerated() {
      return regenerated;
    },
  };
}

describe('bracket lifecycle use cases', () => {
  it('generateBracket throws NotFoundError when group is missing', async () => {
    const fixture = fakeStore(null);

    await expect(
      generateBracket({ divisionId: 'g1', adminId: 'admin' }, fixture.store)
    ).rejects.toThrow(NotFoundError);

    expect(fixture.generated).toBeNull();
  });

  it('generateBracket rejects non-draft tournaments', async () => {
    const fixture = fakeStore({ ...baseGroup, tournamentStatus: 'active' });

    await expect(
      generateBracket({ divisionId: 'g1', adminId: 'admin' }, fixture.store)
    ).rejects.toThrow(PolicyViolationError);

    expect(fixture.generated).toBeNull();
  });

  it('generateBracket rejects when bracket matches already exist', async () => {
    const fixture = fakeStore(baseGroup, 1);

    await expect(
      generateBracket({ divisionId: 'g1', adminId: 'admin' }, fixture.store)
    ).rejects.toThrow(BadRequestError);

    expect(fixture.generated).toBeNull();
  });

  it('generateBracket delegates store.generate', async () => {
    const fixture = fakeStore();

    await generateBracket(
      { divisionId: 'g1', adminId: 'admin' },
      fixture.store
    );

    expect(fixture.generated).toMatchObject({
      command: { divisionId: 'g1', adminId: 'admin' },
      activity: { eventType: 'bracket.generate' },
    });
  });

  it('resetBracket throws when there is no saved layout', async () => {
    const fixture = fakeStore();

    await expect(
      resetBracket({ divisionId: 'g1', adminId: 'admin' }, fixture.store)
    ).rejects.toThrow(BadRequestError);

    expect(fixture.reset).toBeNull();
  });

  it('shuffleBracket delegates store.shuffle', async () => {
    const fixture = fakeStore();

    await shuffleBracket({ divisionId: 'g1', adminId: 'admin' }, fixture.store);

    expect(fixture.shuffled).toMatchObject({
      command: { divisionId: 'g1', adminId: 'admin' },
      activity: { eventType: 'bracket.shuffle' },
    });
  });

  it('regenerateBracket rejects completed tournaments', async () => {
    const fixture = fakeStore({
      ...baseGroup,
      tournamentStatus: 'completed',
    });

    await expect(
      regenerateBracket({ divisionId: 'g1', adminId: 'admin' }, fixture.store)
    ).rejects.toThrow(PolicyViolationError);

    expect(fixture.regenerated).toBeNull();
  });
});
