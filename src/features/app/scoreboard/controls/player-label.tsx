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
        'my-2.5 truncate text-center text-3xl leading-none font-semibold text-white uppercase max-xl:text-2xl',
        className
      )}
    >
      {children}
    </Label>
  );
};
