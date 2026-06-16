import { describe, expect, it } from 'vitest';

import { matchRouter } from '../router';

describe('match router policy surface', () => {
  it('does not expose raw create or update match mutations', () => {
    expect(matchRouter).not.toHaveProperty('create');
    expect(matchRouter).not.toHaveProperty('update');
  });

  it('keeps safe match transition procedures exposed', () => {
    expect(matchRouter).toMatchObject({
      createCustom: expect.anything(),
      updateScore: expect.anything(),
      setWinner: expect.anything(),
      adminSetMatchStatus: expect.anything(),
    });
  });
});
