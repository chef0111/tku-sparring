import { createContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { GroupData } from '@/contracts/tournament/group';
import type { MatchData } from '@/contracts/tournament/match';
import type { BracketsTabDndSnapshot } from '@/features/dashboard/hooks/use-brackets-tab-dnd';
import type { BracketsTabQueriesSnapshot } from '@/features/dashboard/hooks/use-brackets-tab-queries';

export type TournamentBracketContextValue = BracketsTabQueriesSnapshot &
  BracketsTabDndSnapshot & {
    tournamentId: string;
    groups: Array<GroupData>;
    readOnly: boolean;
    tournamentStatus: string;
    isDraft: boolean;
    selectedGroupId: string | null;
    setSelectedGroupId: Dispatch<SetStateAction<string | null>>;
    selectedMatch: MatchData | null;
    setSelectedMatch: Dispatch<SetStateAction<MatchData | null>>;
    panelOpen: boolean;
    setPanelOpen: Dispatch<SetStateAction<boolean>>;
    arenaOrderSheetOpen: boolean;
    setArenaOrderSheetOpen: Dispatch<SetStateAction<boolean>>;
    handleSlotClick: (match: MatchData) => void;
    matchDetail: MatchData | null;
    /** Pool drop target enabled (group has matches). */
    slotReturnEnabled: boolean;
    /** Hint under pool / empty states when athletes can be dragged back from bracket. */
    showArrangedHint: boolean;
  };

export const TournamentBracketContext = createContext<
  TournamentBracketContextValue | undefined
>(undefined);
