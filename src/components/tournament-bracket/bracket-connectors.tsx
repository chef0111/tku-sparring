import type { BracketConnectorPath } from '@/lib/tournament/bracket/bracket-layout';
import type { MatchStatus } from '@/features/dashboard/types';

const statusStroke: Record<MatchStatus, string> = {
  pending: 'stroke-muted-foreground/40',
  active: 'stroke-blue-500',
  complete: 'stroke-emerald-500',
};

export interface BracketConnectorsProps {
  width: number;
  height: number;
  paths: Array<BracketConnectorPath>;
}

export function BracketConnectors({
  width,
  height,
  paths,
}: BracketConnectorsProps) {
  return (
    <svg
      width={width}
      height={height}
      className="absolute inset-0 select-none"
      aria-hidden
    >
      {paths.map((c, i) => (
        <path
          key={i}
          d={c.d}
          fill="none"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          strokeMiterlimit={4}
          strokeWidth={1.5}
          className={statusStroke[c.status] ?? statusStroke.pending}
        />
      ))}
    </svg>
  );
}
