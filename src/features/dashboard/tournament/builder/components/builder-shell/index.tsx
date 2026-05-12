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
        <Alert className="mx-4 mt-3">
          <AlertTitle>Read-only workspace</AlertTitle>
          <AlertDescription>
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
