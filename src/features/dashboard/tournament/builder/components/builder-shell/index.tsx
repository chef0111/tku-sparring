import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  return (
    <div className="flex h-dvh flex-col">
      {header}
      {readOnly && (
        <Alert
          variant="warning"
          className="fixed top-16 left-1/2 z-20 w-fit -translate-x-1/2 border-amber-500/20 bg-amber-500/10 backdrop-blur-xs"
        >
          <AlertTitle className="text-center">Read-only workspace</AlertTitle>
          <AlertDescription className="text-center">
            This tournament is completed. Builder mutations are disabled so
            results stay locked.
          </AlertDescription>
        </Alert>
      )}
      <main className="relative flex flex-1 overflow-hidden">{children}</main>
      {footer}
    </div>
  );
}
