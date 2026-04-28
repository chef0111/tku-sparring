import type React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      className={cn(
        'animate-skeleton bg-muted/50 relative overflow-hidden rounded-sm',
        'before:animate-skeleton before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent_20%,var(--skeleton-highlight),transparent_60%)] before:bg-size-[200%_100%]',
        className
      )}
      data-slot="skeleton"
      {...props}
    />
  );
}
