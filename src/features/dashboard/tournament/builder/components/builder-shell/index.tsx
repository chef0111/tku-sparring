import * as React from 'react';
import { useBracketChrome } from '../../context/bracket-chrome';
import { EdgeReveal } from './edge-reveal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface BuilderShellProps {
  header: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
  readOnly?: boolean;
}

export function BuilderShell({
  header,
  children,
  footer,
  readOnly,
}: BuilderShellProps) {
  const { isFullscreen } = useBracketChrome();

  return (
    <div
      className={cn('flex h-dvh flex-col', isFullscreen && 'overflow-hidden')}
      data-bracket-fullscreen={isFullscreen || undefined}
    >
      {isFullscreen ? <EdgeReveal edge="top">{header}</EdgeReveal> : header}
      {readOnly && !isFullscreen && (
        <Alert
          variant="warning"
          className="fixed top-16 left-1/2 z-20 w-fit -translate-x-1/2 border-amber-500/20 bg-amber-500/10 backdrop-blur-sm"
        >
          <AlertTitle className="text-center">Read-only workspace</AlertTitle>
          <AlertDescription className="text-center">
            This tournament is completed. Features are disabled so results stay
            locked.
          </AlertDescription>
        </Alert>
      )}
      <main
        className={cn(
          'relative flex flex-1 overflow-hidden',
          isFullscreen && 'fixed inset-0 z-50'
        )}
      >
        {children}
      </main>
      {isFullscreen ? <EdgeReveal edge="bottom">{footer}</EdgeReveal> : footer}
    </div>
  );
}
