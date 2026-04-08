import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  hits: number;
  wins: number;
  side?: 'red' | 'blue';
  className?: string;
}

export const StatsCard = ({ hits, wins, side, className }: StatsCardProps) => {
  return (
    <Card
      className={cn(
        'pointers-event-none relative flex h-[15.5vh] w-full flex-row items-center justify-center gap-15 overflow-hidden rounded-none px-4',
        'before:absolute before:inset-0 before:bg-linear-to-br before:from-white/10 before:to-transparent',
        side === 'blue' ? 'bg-[#155ea4]' : 'bg-[#dc0000]',
        className
      )}
    >
      {side === 'blue' ? (
        <>
          <StatItem label="HITS" value={hits} />
          <StatItem label="#WON" value={wins} />
        </>
      ) : (
        <>
          <StatItem label="#WON" value={wins} />
          <StatItem label="HITS" value={hits} />
        </>
      )}
    </Card>
  );
};

interface StatItemProps {
  label: string;
  value: number;
  className?: string;
}

export const StatItem = ({ label, value, className }: StatItemProps) => {
  return (
    <div
      className={cn(
        'relative flex w-28 flex-col items-center justify-start',
        className
      )}
    >
      <Label className="metrics text-foreground/85 text-3xl max-xl:text-2xl">
        {label}
      </Label>
      <p className="metrics text-5xl">{value}</p>
    </div>
  );
};
