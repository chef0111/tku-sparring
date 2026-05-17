import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { openAPI, username } from 'better-auth/plugins';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { prisma } from './db';
import { PasswordSchema } from './validations';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'mongodb',
  }),
  emailAndPassword: {
    enabled: true,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path === '/sign-up/email' ||
        ctx.path === '/reset-password' ||
        ctx.path === '/change-password'
      ) {
        const body = await ctx.body;
        const password = body.password || body.newPassword;

        const { error } = PasswordSchema.safeParse(password);

        if (error) {
          throw new APIError('BAD_REQUEST', {
            message: 'Password not strong enough.',
          });
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      const response = (await ctx.context.returned) as Record<string, unknown>;
      const user = response?.user as Record<string, unknown> | undefined;

      if (user) {
        delete user.email;
        delete user.emailVerified;
        delete user.createdAt;
        delete user.updatedAt;
      }
    }),
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL as string],
  plugins: [
    username({
      minUsernameLength: 3,
      displayUsernameValidator: (displayUsername) => {
        return /^[a-zA-Z0-9_.-]+$/.test(displayUsername);
      },
      validationOrder: {
        username: 'post-normalization',
        displayUsername: 'post-normalization',
      },
    }),
    ...(process.env.NODE_ENV === 'development' ? [openAPI()] : []),
    tanstackStartCookies(),
  ],
  experimental: { joins: true },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
