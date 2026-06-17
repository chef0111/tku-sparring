import {
  NotFoundError,
  PolicyViolationError,
} from '@/server/application/errors';

type ProcedureErrors = {
  NOT_FOUND: (opts: { message: string }) => unknown;
  BAD_REQUEST: (opts: { message: string }) => unknown;
};

export function mapAppError(errors: ProcedureErrors, e: unknown): never {
  if (e instanceof NotFoundError) {
    throw errors.NOT_FOUND({ message: e.message });
  }
  if (e instanceof PolicyViolationError) {
    throw errors.BAD_REQUEST({ message: e.message });
  }
  throw e;
}
