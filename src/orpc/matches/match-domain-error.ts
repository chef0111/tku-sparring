import { ORPCError } from '@orpc/server';

export function throwMatchBadRequest(message: string): never {
  throw new ORPCError('BAD_REQUEST', {
    message,
    defined: true,
  });
}
