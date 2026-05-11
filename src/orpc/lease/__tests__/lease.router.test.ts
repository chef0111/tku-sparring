import { describe, expect, it } from 'vitest';

import { RespondTakeoverSchema } from '../lease.dto';
import router from '@/orpc/router';

describe('lease router registration', () => {
  it('registers the phase B lease procedures', () => {
    const leaseRouter = (router as Record<string, unknown>).lease as
      | Record<string, unknown>
      | undefined;

    expect(leaseRouter).toBeDefined();
    expect(leaseRouter).toMatchObject({
      acquire: expect.anything(),
      heartbeat: expect.anything(),
      release: expect.anything(),
      requestTakeover: expect.anything(),
      respondTakeover: expect.anything(),
      listForTournament: expect.anything(),
    });
  });

  it('requires deviceId for takeover responses', () => {
    expect(() =>
      RespondTakeoverSchema.parse({
        requestId: 'request-1',
        approve: true,
      })
    ).toThrow();

    expect(
      RespondTakeoverSchema.parse({
        requestId: 'request-1',
        approve: true,
        deviceId: 'device-1',
      })
    ).toEqual({
      requestId: 'request-1',
      approve: true,
      deviceId: 'device-1',
    });
  });
});
