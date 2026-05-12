import { AlertTriangle } from 'lucide-react';
import type {
  GroupData,
  TournamentAthleteData,
} from '@/features/dashboard/types';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type Violation = 'gender' | 'belt' | 'weight';

export function getViolations(
  athlete: TournamentAthleteData,
  group: GroupData
): Array<Violation> {
  const violations: Array<Violation> = [];

  if (group.gender && athlete.gender !== group.gender) {
    violations.push('gender');
  }
  if (group.beltMin != null && athlete.beltLevel < group.beltMin) {
    violations.push('belt');
  }
  if (group.beltMax != null && athlete.beltLevel > group.beltMax) {
    violations.push('belt');
  }
  if (group.weightMin != null && athlete.weight < group.weightMin) {
    violations.push('weight');
  }
  if (group.weightMax != null && athlete.weight > group.weightMax) {
    violations.push('weight');
  }

  return Array.from(new Set(violations));
}

interface OutOfRangeBadgeProps {
  violations: Array<Violation>;
}

export function OutOfRangeBadge({ violations }: OutOfRangeBadgeProps) {
  if (violations.length === 0) return null;

  const label = violations.join(', ');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="size-3" />
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        Athlete does not match group constraints: {label}
      </TooltipContent>
    </Tooltip>
  );
}

interface GroupViolationCountBadgeProps {
  count: number;
}

export function GroupViolationCountBadge({
  count,
}: GroupViolationCountBadgeProps) {
  if (count === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="size-3" />
          {count}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {count} athlete{count > 1 ? 's' : ''} outside group constraints
      </TooltipContent>
    </Tooltip>
  );
}
