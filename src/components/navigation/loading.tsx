import { LogoIcon } from '@/components/ui/logo';

interface LoadingScreenProps {
  title?: string;
  description?: string;
}

export default function LoadingScreen({
  title = 'Configuring your app...',
  description = 'Please wait while we prepare everything for you',
}: LoadingScreenProps) {
  return (
    <section className="flex h-dvh w-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex items-center justify-center gap-2">
          <LogoIcon className="size-28" />
          <span className="font-esbuild text-8xl font-bold">tku.ss</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 pt-8">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground text-lg">{description}</p>
        </div>
      </div>
    </section>
  );
}
