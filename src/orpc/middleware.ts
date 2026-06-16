import { base } from '@/orpc/base';
import { auth } from '@/lib/auth';
import { unauthorized } from '@/orpc/errors';

export const authed = base.middleware(async ({ context, next }) => {
  const headers = context.headers;

  if (!headers) {
    unauthorized('Unauthorized: No headers provided');
  }

  const session = await auth.api.getSession({ headers });

  if (!session) {
    unauthorized('Unauthorized: Invalid session');
  }

  return next({
    context: {
      user: session.user,
      session: session.session,
    },
  });
});

export const authorized = base.use(authed);
