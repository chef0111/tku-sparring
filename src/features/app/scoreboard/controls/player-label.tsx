import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PlayerLabelProps {
  children: React.ReactNode;
  className?: string;
}

export const PlayerLabel = ({ children, className }: PlayerLabelProps) => {
  return (
    <Label
      className={cn(
        'mx-0 inline-block w-full truncate text-center text-2xl leading-snug font-bold text-white uppercase max-xl:text-xl',
        className
      )}
    >
      {children}
    </Label>
  );
};
