import * as React from 'react';
import { cn } from '@/lib/utils';

const HIDE_DELAY_MS = 250;

type EdgeRevealProps = {
  edge: 'top' | 'bottom' | 'left';
  children: React.ReactNode;
  contentClassName?: string;
};

export function EdgeReveal({
  edge,
  children,
  contentClassName,
}: EdgeRevealProps) {
  const [open, setOpen] = React.useState(false);
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = React.useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setOpen(true);
  }, []);

  const scheduleHide = React.useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setOpen(false), HIDE_DELAY_MS);
  }, []);

  React.useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const stripClass =
    edge === 'top'
      ? 'fixed inset-x-0 top-0 z-[60] h-4'
      : edge === 'bottom'
        ? 'fixed inset-x-0 bottom-0 z-[60] h-4'
        : 'fixed inset-y-0 left-0 z-[55] w-4';

  const contentPosition =
    edge === 'top'
      ? cn(
          'fixed inset-x-0 top-0 z-[60]',
          open
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-full opacity-0'
        )
      : edge === 'bottom'
        ? cn(
            'fixed inset-x-0 bottom-0 z-[60]',
            open
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-full opacity-0'
          )
        : cn(
            'fixed inset-y-0 right-0 z-[55]',
            open
              ? 'pointer-events-auto translate-x-0 opacity-100'
              : 'pointer-events-none translate-x-full opacity-0'
          );

  return (
    <>
      <div className={stripClass} aria-hidden onPointerEnter={show} />
      <div
        className={cn(
          contentPosition,
          'transition-all duration-200',
          contentClassName
        )}
        onPointerEnter={show}
        onPointerLeave={scheduleHide}
      >
        {children}
      </div>
    </>
  );
}
