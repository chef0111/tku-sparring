import { describe, expect, it } from 'vitest';

import { SetTournamentStatusSchema } from '../dto';
import router from '@/orpc/router';

describe('tournament router registration', () => {
  it('registers the lifecycle status mutation', () => {
    const tournamentRouter = (router as Record<string, unknown>).tournament as
      | Record<string, unknown>
      | undefined;

    expect(tournamentRouter).toBeDefined();
    expect(tournamentRouter).toMatchObject({
      setStatus: expect.anything(),
      setArenaGroupOrder: expect.anything(),
      moveGroupArena: expect.anything(),
      ensureArenaSlot: expect.anything(),
      retireArena: expect.anything(),
    });
  });

  it('accepts only valid tournament status transitions as input shape', () => {
    expect(
      SetTournamentStatusSchema.parse({
        id: 'tournament-1',
        status: 'active',
      })
    ).toEqual({
      id: 'tournament-1',
      status: 'active',
    });

    expect(() =>
      SetTournamentStatusSchema.parse({
        id: 'tournament-1',
        status: 'archived',
      })
    ).toThrow();
  });
});
