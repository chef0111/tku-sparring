import '@/polyfill';

import { RPCHandler } from '@orpc/server/fetch';
import { onError } from '@orpc/server';
import { createFileRoute } from '@tanstack/react-router';
import router from '@/orpc/router';
import { serverRepos } from '@/server/composition';

const handler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      console.error('[api/rpc]', error);
    }),
  ],
});

async function handle({ request }: { request: Request }) {
  const { response } = await handler.handle(request, {
    prefix: '/api/rpc',
    context: {
      headers: request.headers,
      repos: serverRepos,
    },
  });

  return response ?? new Response('Not Found', { status: 404 });
}

export const Route = createFileRoute('/api/rpc/$')({
  server: {
    handlers: {
      HEAD: handle,
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
});
