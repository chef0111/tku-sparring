import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools';
import appCss from '../styles.css?url';
import type { QueryClient } from '@tanstack/react-query';
import { NuqsAdapter } from '@/integrations/nuqs/tanstack-router-adapter';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { NotFound } from '@/components/not-found';
import { cn } from '@/lib/utils';
import { SettingsProvider } from '@/contexts/settings';
import { useResolvedTheme } from '@/contexts/themes/use-theme';

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TKU Sparring System',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'preload',
        href: '/fonts/ESBuild.otf',
        as: 'font',
        type: 'font/opentype',
        crossorigin: 'anonymous',
      },
      {
        rel: 'preload',
        href: '/fonts/dearpix-2-01.otf',
        as: 'font',
        type: 'font/opentype',
        crossorigin: 'anonymous',
      },
      {
        rel: 'preload',
        href: '/fonts/GeistPixel-Square.ttf',
        as: 'font',
        type: 'font/truetype',
        crossorigin: 'anonymous',
      },
    ],
  }),

  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const isDashboard = useRouterState({
    select: (state) => {
      const path = state.location.pathname;
      return path === '/dashboard' || path.startsWith('/dashboard/');
    },
  });
  const resolved = useResolvedTheme();
  const themeClass = isDashboard ? resolved : 'dark';

  return (
    <html
      lang="en"
      className={cn('font-sans antialiased', themeClass)}
      suppressHydrationWarning
    >
      <head suppressHydrationWarning>
        <HeadContent />
      </head>
      <body className={cn('h-dvh', themeClass)} suppressHydrationWarning>
        <NuqsAdapter>
          <TooltipProvider>
            <SettingsProvider>{children}</SettingsProvider>
          </TooltipProvider>
        </NuqsAdapter>
        <Toaster richColors closeButton />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
