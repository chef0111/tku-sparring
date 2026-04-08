import {
  Link,
  Outlet,
  createFileRoute,
  useNavigate,
} from '@tanstack/react-router';
import { useEffect } from 'react';
import { ChevronLeftIcon } from 'lucide-react';
import LoadingScreen from '@/components/navigation/loading';
import { LogoIcon } from '@/components/ui/logo';
import { FloatingPaths } from '@/components/ui/floating-paths';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
  pendingComponent: () => <LoadingScreen title="Configuring your account..." />,
});

function AuthLayout() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && session) {
      navigate({ to: '/' });
    }
  }, [session, isPending, navigate]);

  if (isPending) return null;

  if (session) return null;

  return (
    <main className="relative md:h-dvh md:overflow-hidden lg:grid lg:grid-cols-2">
      <div className="bg-secondary dark:bg-secondary/20 relative hidden h-full flex-col border-r p-10 lg:flex">
        <div className="to-background absolute inset-0 bg-linear-to-b from-transparent via-transparent" />
        <div className="flex size-fit items-center justify-center gap-1">
          <LogoIcon className="mr-auto h-5" />
          <span className="font-esbuild text-2xl font-bold">tku.ss</span>
        </div>

        <div className="z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-xl italic">
              &ldquo;A modern, user-friendly web application for managing
              Taekwondo sparring matches of UIT Taekwondo Tournament.&rdquo;
            </p>
            <footer className="font-esbuild text-sm font-semibold">
              - Taekwondo UIT
            </footer>
          </blockquote>
        </div>
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>
      <div className="relative flex min-h-dvh flex-col justify-center p-4">
        <div
          aria-hidden
          className="absolute inset-0 isolate -z-10 opacity-60 contain-strict"
        >
          <div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.04)_50%,--theme(--color-foreground/.015)_80%)] absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full blur-md" />
          <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full" />
          <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full" />
        </div>
        <Button className="absolute top-7 left-5" variant="ghost" asChild>
          <Link to="/">
            <ChevronLeftIcon />
            Home
          </Link>
        </Button>
        <div className="mx-auto space-y-4 sm:w-sm">
          <div className="flex size-fit items-center justify-center gap-1 lg:hidden">
            <LogoIcon className="mr-auto h-5" />
            <span className="font-esbuild text-2xl font-bold">tku.ss</span>
          </div>
          <Outlet />
          <p className="text-muted-foreground mt-8 text-center text-sm">
            Taekwondo sparring system from{' '}
            <a
              className="hover:text-primary underline underline-offset-4"
              href="https://www.facebook.com/uittaekwondo"
              target="_blank"
            >
              Taekwondo UIT
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
