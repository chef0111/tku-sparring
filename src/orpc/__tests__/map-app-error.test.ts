import { describe, expect, it } from 'vitest';
import { ORPCError } from '@orpc/server';

import { mapAppError, toOrpcError } from '../map-app-error';
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

describe('toOrpcError', () => {
  it('maps NotFoundError to ORPCError', () => {
    const result = toOrpcError(new NotFoundError('Match not found'));
    expect(result).toBeInstanceOf(ORPCError);
    expect((result as ORPCError<string, unknown>).code).toBe('NOT_FOUND');
  });

  it('maps PolicyViolationError to ORPCError', () => {
    const result = toOrpcError(
      new PolicyViolationError('Completed tournaments are read-only')
    );
    expect(result).toBeInstanceOf(ORPCError);
    expect((result as ORPCError<string, unknown>).code).toBe('BAD_REQUEST');
  });

  it('returns unknown errors unchanged', () => {
    const error = new Error('boom');
    expect(toOrpcError(error)).toBe(error);
  });
});
