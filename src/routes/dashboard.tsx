import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { AppSidebar } from '@/features/dashboard';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import LoadingScreen from '@/components/navigation/loading';

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
});

function DashboardLayout() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      navigate({ to: '/login' });
    }
  }, [session, isPending, navigate]);

  if (isPending) {
    return <LoadingScreen title="Configuring your dashboard..." />;
  }

  if (!session) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
