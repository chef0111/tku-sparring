import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import {
  Provider as QueryProvider,
  getContext as getQueryContext,
} from './integrations/tanstack-query/root-provider';

export function getRouter() {
  const context = getQueryContext();

  return createRouter({
    routeTree,
    context,
    scrollRestoration: true,
    Wrap: ({ children }) => (
      <QueryProvider queryClient={context.queryClient}>
        {children}
      </QueryProvider>
    ),
  });
}
