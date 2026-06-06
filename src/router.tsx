import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { routeTree } from './routeTree.gen';
import {
  Provider as QueryProvider,
  getContext as getQueryContext,
} from './integrations/tanstack-query/root-provider';

export function getRouter() {
  const context = getQueryContext();

  const router = createRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    Wrap: ({ children }) => (
      <QueryProvider queryClient={context.queryClient}>
        {children}
      </QueryProvider>
    ),
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient: context.queryClient,
    wrapQueryClient: false,
  });

  return router;
}
