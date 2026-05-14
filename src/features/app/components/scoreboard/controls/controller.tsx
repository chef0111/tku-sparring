import { cn } from '@/lib/utils';

interface ControllerProps {
  children: React.ReactNode;
  className?: string;
}

export const Controller = ({ children, className }: ControllerProps) => {
  return (
    <div
      className={cn(
        'relative flex h-full w-[13vw] flex-col items-center justify-between',
        className
      )}
    >
      {children}
    </div>
  );
};

interface ControllerContentProps {
  children: React.ReactNode;
  side: 'red' | 'blue';
  className?: string;
}

export const ControllerContent = ({
  children,
  side,
  className,
}: ControllerContentProps) => {
  return (
    <div
      className={cn(
        'relative flex h-[82%] w-full flex-col items-center justify-start overflow-hidden p-2.5',
        'before:pointer-events-none before:absolute before:inset-0 before:bg-linear-to-br before:from-white/10 before:to-transparent',
        side === 'blue'
          ? 'rounded-tr-[10px] bg-[#1e68ae]'
          : 'rounded-tl-[10px] bg-linear-to-b from-[#d80405] to-[#9b0002]',
        className
      )}
    >
      {children}
    </div>
  );
};

interface ScoreButtonsProps {
  children: React.ReactNode;
  side: 'red' | 'blue';
  className?: string;
}

export const ScoreButtons = ({
  children,
  side,
  className,
}: ScoreButtonsProps) => {
  return (
    <div
      className={cn(
        'flex flex-row items-center justify-between py-[4.8vh]',
        side === 'blue' ? 'flex-row-reverse' : '',
        className
      )}
    >
      {children}
    </div>
  );
};
