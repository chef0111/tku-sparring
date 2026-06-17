import { describe, expect, it } from 'vitest';

import { AppError, NotFoundError, PolicyViolationError } from '../errors';

describe('application errors', () => {
  it('preserves message on NotFoundError', () => {
    const error = new NotFoundError('Match not found');
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe('Match not found');
    expect(error.name).toBe('NotFoundError');
  });

  it('preserves message on PolicyViolationError', () => {
    const error = new PolicyViolationError(
      'Completed tournaments are read-only'
    );
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(PolicyViolationError);
    expect(error.message).toBe('Completed tournaments are read-only');
    expect(error.name).toBe('PolicyViolationError');
  });
});
