import { ORPCError } from '@orpc/server';

type ErrorCode = 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND';

function fail(code: ErrorCode, message: string): never {
  throw new ORPCError(code, {
    message,
    defined: true,
  });
}

export function badRequest(message: string): never {
  fail('BAD_REQUEST', message);
}

export function unauthorized(message = 'Unauthorized'): never {
  fail('UNAUTHORIZED', message);
}

export function forbidden(message = 'Forbidden'): never {
  fail('FORBIDDEN', message);
}

export function notFound(message: string): never {
  fail('NOT_FOUND', message);
}
