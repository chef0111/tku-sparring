import { createFileRoute } from '@tanstack/react-router';
import { SignJWT } from 'jose';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const Route = createFileRoute('/api/tournament/socket-token')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user?.id) {
          return new Response('Unauthorized', { status: 401 });
        }

        const rawTournamentId = new URL(request.url).searchParams.get(
          'tournamentId'
        );
        const tournamentId =
          rawTournamentId && rawTournamentId.length > 0
            ? rawTournamentId
            : undefined;

        if (tournamentId) {
          const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            select: { id: true },
          });

          if (!tournament) {
            return new Response('Not found', { status: 404 });
          }
        }

        const secretRaw = process.env.TOURNAMENT_SOCKET_JWT_SECRET?.trim();
        if (!secretRaw) {
          return new Response('Server misconfigured', { status: 503 });
        }

        const secret = new TextEncoder().encode(secretRaw);
        const jwt =
          tournamentId != null
            ? new SignJWT({ tid: tournamentId }).setProtectedHeader({
                alg: 'HS256',
              })
            : new SignJWT({ cat: 'arena' }).setProtectedHeader({
                alg: 'HS256',
              });

        const token = await jwt
          .setSubject(session.user.id)
          .setIssuedAt()
          .setExpirationTime('5m')
          .sign(secret);

        return Response.json({ token });
      },
    },
  },
});
