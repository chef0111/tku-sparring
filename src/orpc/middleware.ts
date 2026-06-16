import { os } from '@orpc/server';
import { auth } from '@/lib/auth';
import { unauthorized } from '@/orpc/errors';

export const authed = os.middleware(async ({ context, next }) => {
  const headers = (context as { headers?: Headers }).headers;

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

export const authedProcedure = os.use(authed);
