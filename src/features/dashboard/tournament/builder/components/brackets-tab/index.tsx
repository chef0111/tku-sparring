import { TournamentBracketProvider } from '../../context/tournament-bracket/provider';
import { EmptyGroupsPlaceholder } from './empty-groups-placeholder';
import type { GroupData } from '@/features/dashboard/types';

export interface BracketsTabProps {
  tournamentId: string;
  groups: Array<GroupData>;
  readOnly: boolean;
  tournamentStatus: string;
}

export function BracketsTab({
  tournamentId,
  groups,
  readOnly,
  tournamentStatus,
}: BracketsTabProps) {
  if (groups.length === 0) {
    return <EmptyGroupsPlaceholder />;
  }

  return (
    <TournamentBracketProvider
      tournamentId={tournamentId}
      groups={groups}
      readOnly={readOnly}
      tournamentStatus={tournamentStatus}
    />
  );
}
