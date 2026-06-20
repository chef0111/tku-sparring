import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { AppSidebar } from '@/features/dashboard/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import LoadingScreen from '@/components/navigation/loading';
import { sessionQueryOptions } from '@/queries/session';
import { ThemeProvider } from '@/contexts/themes';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const session = await queryClient.ensureQueryData(sessionQueryOptions());

    if (!session) {
      throw redirect({ to: '/login' });
    }
    return { user: session.user };
  },
  pendingComponent: () => <LoadingScreen title="Loading your dashboard..." />,
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="start-theme">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
