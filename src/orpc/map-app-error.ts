import { ORPCError } from '@orpc/server';

import {
  BadRequestError,
  NotFoundError,
  PolicyViolationError,
} from '@/server/application/errors';

type ProcedureErrors = {
  NOT_FOUND: (opts: { message: string }) => unknown;
  BAD_REQUEST: (opts: { message: string }) => unknown;
};

export function toOrpcError(e: unknown): unknown {
  if (e instanceof NotFoundError) {
    return new ORPCError('NOT_FOUND', { message: e.message, defined: true });
  }
  if (e instanceof PolicyViolationError) {
    return new ORPCError('BAD_REQUEST', { message: e.message, defined: true });
  }
  if (e instanceof BadRequestError) {
    return new ORPCError('BAD_REQUEST', { message: e.message, defined: true });
  }
  return e;
}

export function mapAppError(errors: ProcedureErrors, e: unknown): never {
  if (e instanceof NotFoundError) {
    throw errors.NOT_FOUND({ message: e.message });
  }
  if (e instanceof PolicyViolationError) {
    throw errors.BAD_REQUEST({ message: e.message });
  }
  if (e instanceof BadRequestError) {
    throw errors.BAD_REQUEST({ message: e.message });
  }
  throw e;
}
