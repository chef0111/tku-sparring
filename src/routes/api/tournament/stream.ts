import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { subscribeToTournamentSseEvents } from '@/lib/tournament/tournament-sse-bus';

const encoder = new TextEncoder();
const HEARTBEAT_INTERVAL_MS = 20_000;
const streamSearchSchema = z.object({
  tournamentId: z.string().min(1),
});

function encodeComment(comment: string) {
  return encoder.encode(`: ${comment}\n\n`);
}

function encodeEvent(event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export const Route = createFileRoute('/api/tournament/stream')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
          return new Response('Unauthorized', { status: 401 });
        }

        const searchParams = new URL(request.url).searchParams;
        const result = streamSearchSchema.safeParse({
          tournamentId: searchParams.get('tournamentId'),
        });

        if (!result.success) {
          return new Response('Invalid tournamentId', { status: 400 });
        }

        const tournamentId = result.data.tournamentId;
        let cleanup = () => {};

        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            let closed = false;

            const safeEnqueue = (chunk: Uint8Array) => {
              if (closed) {
                return false;
              }

              try {
                controller.enqueue(chunk);
                return true;
              } catch {
                close();
                return false;
              }
            };

            const close = () => {
              if (closed) {
                return;
              }

              closed = true;
              cleanup();

              try {
                controller.close();
              } catch {
                // Stream may already be closed if a disconnect raced with publish.
              }
            };

            const onAbort = () => {
              close();
            };

            request.signal.addEventListener('abort', onAbort, { once: true });

            try {
              if (closed || request.signal.aborted) {
                return;
              }

              const unsubscribe = subscribeToTournamentSseEvents(
                tournamentId,
                (event) => {
                  if (event.type === 'invalidate') {
                    safeEnqueue(encodeEvent('invalidate', event));
                  }
                }
              );
              const heartbeat = setInterval(() => {
                safeEnqueue(encodeComment('heartbeat'));
              }, HEARTBEAT_INTERVAL_MS);

              cleanup = () => {
                clearInterval(heartbeat);
                unsubscribe();
                request.signal.removeEventListener('abort', onAbort);
              };

              safeEnqueue(encodeComment('connected'));
              safeEnqueue(
                encodeEvent('invalidate', {
                  type: 'invalidate',
                  tournamentId,
                })
              );

              safeEnqueue(
                encodeEvent('invalidate', {
                  type: 'invalidate',
                  tournamentId,
                })
              );
            } catch (error) {
              cleanup();

              try {
                controller.error(error);
              } catch {
                close();
              }
            }
          },
          cancel() {
            cleanup();
          },
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
          },
        });
      },
    },
  },
});
