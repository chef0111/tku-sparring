import { AlertTriangle } from 'lucide-react';
import type {
  DivisionData,
  TournamentAthleteData,
} from '@/contracts/tournament/division';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type Violation = 'gender' | 'belt' | 'weight';

export function getViolations(
  athlete: TournamentAthleteData,
  division: DivisionData
): Array<Violation> {
  const violations: Array<Violation> = [];

  if (division.gender && athlete.gender !== division.gender) {
    violations.push('gender');
  }
  if (division.beltMin != null && athlete.beltLevel < division.beltMin) {
    violations.push('belt');
  }
  if (division.beltMax != null && athlete.beltLevel > division.beltMax) {
    violations.push('belt');
  }
  if (division.weightMin != null && athlete.weight < division.weightMin) {
    violations.push('weight');
  }
  if (division.weightMax != null && athlete.weight > division.weightMax) {
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
        Athlete does not match division constraints: {label}
      </TooltipContent>
    </Tooltip>
  );
}

interface DivisionViolationBadgeProps {
  count: number;
}

export function DivisionViolationBadge({ count }: DivisionViolationBadgeProps) {
  if (count === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="warning" className="gap-1">
          <AlertTriangle className="size-3" />
          {count}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {count} athlete{count > 1 ? 's' : ''} outside division constraints
      </TooltipContent>
    </Tooltip>
  );
}
