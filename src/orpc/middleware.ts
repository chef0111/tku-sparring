import { ORPCError } from '@orpc/server';

import { base } from '@/orpc/base';
import { auth } from '@/lib/auth';
import { toOrpcError } from '@/orpc/map-app-error';

export const authed = base.middleware(async ({ context, next }) => {
  const headers = context.headers;

  if (!headers) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'Unauthorized: No headers provided',
      defined: true,
    });
  }

  const session = await auth.api.getSession({ headers });

  if (!session) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'Unauthorized: Invalid session',
      defined: true,
    });
  }

  return next({
    context: {
      user: session.user,
      session: session.session,
    },
  });
});

export const catchAppErrors = base.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (e) {
    const mapped = toOrpcError(e);
    throw mapped;
  }
});

export const authorized = base.use(catchAppErrors).use(authed);
