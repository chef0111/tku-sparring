import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PenaltyBoxProps {
  fouls: number;
  side: 'red' | 'blue';
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
}

export const PenaltyBox = ({
  fouls,
  side,
  onClick,
  onContextMenu,
  className,
  disabled = false,
}: PenaltyBoxProps) => {
  return (
    <Card
      className={cn(
        'relative flex h-[18%] w-full flex-col items-center justify-center gap-2.5 overflow-hidden rounded-none px-4',
        'before:pointer-events-none before:absolute before:inset-0 before:bg-linear-to-br before:from-white/10 before:to-transparent',
        side === 'blue'
          ? 'rounded-br-[10px] bg-[#125a9f]'
          : 'rounded-bl-[10px] bg-[#c10002]',
        className
      )}
    >
      <Penalty
        fouls={fouls}
        onClick={onClick}
        onContextMenu={onContextMenu}
        disabled={disabled}
      />
    </Card>
  );
};

interface PenaltyProps {
  fouls: number;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
}

export const Penalty = ({
  fouls,
  onClick,
  onContextMenu,
  className,
  disabled = false,
}: PenaltyProps) => {
  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={cn(
        'relative flex w-39 cursor-pointer flex-col items-center justify-center transition-all duration-300',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <Label className="metrics text-3xl max-xl:text-2xl">GAM-JEOM</Label>
      <p className="metrics text-7xl leading-none">{fouls}</p>
    </div>
  );
};
