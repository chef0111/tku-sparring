import { describe, expect, it } from 'vitest';
import { ORPCError } from '@orpc/server';
import { BadRequestError, ForbiddenError } from '@/server/application/errors';
import { toOrpcError } from '@/orpc/map-app-error';

describe('toOrpcError', () => {
  it('maps BadRequestError to ORPC BAD_REQUEST', () => {
    const mapped = toOrpcError(
      new BadRequestError('Only custom matches can be deleted')
    );
    expect(mapped).toBeInstanceOf(ORPCError);
    expect((mapped as ORPCError<string, unknown>).code).toBe('BAD_REQUEST');
  });

  it('maps ForbiddenError to ORPC FORBIDDEN', () => {
    const mapped = toOrpcError(new ForbiddenError('Forbidden'));
    expect(mapped).toBeInstanceOf(ORPCError);
    expect((mapped as ORPCError<string, unknown>).code).toBe('FORBIDDEN');
  });
});
