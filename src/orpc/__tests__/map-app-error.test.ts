import { describe, expect, it } from 'vitest';

import { mapAppError } from '../map-app-error';
import {
  NotFoundError,
  PolicyViolationError,
} from '@/server/application/errors';

function fakeErrors() {
  return {
    NOT_FOUND: ({ message }: { message: string }) => {
      throw new Error(`NOT_FOUND:${message}`);
    },
    BAD_REQUEST: ({ message }: { message: string }) => {
      throw new Error(`BAD_REQUEST:${message}`);
    },
  };
}

describe('mapAppError', () => {
  it('maps NotFoundError', () => {
    expect(() =>
      mapAppError(fakeErrors(), new NotFoundError('Match not found'))
    ).toThrow('NOT_FOUND:Match not found');
  });

  it('maps PolicyViolationError', () => {
    expect(() =>
      mapAppError(
        fakeErrors(),
        new PolicyViolationError('Completed tournaments are read-only')
      )
    ).toThrow('BAD_REQUEST:Completed tournaments are read-only');
  });

  it('rethrows unknown errors', () => {
    expect(() => mapAppError(fakeErrors(), new Error('boom'))).toThrow('boom');
  });
});
