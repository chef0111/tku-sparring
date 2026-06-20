import { createContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { DivisionData } from '@/contracts/tournament/division';
import type { MatchData } from '@/contracts/tournament/match';
import type { BracketsTabDndSnapshot } from '@/features/dashboard/hooks/use-brackets-tab-dnd';
import type { BracketsTabQueriesSnapshot } from '@/features/dashboard/hooks/use-brackets-tab-queries';

export type TournamentBracketContextValue = BracketsTabQueriesSnapshot &
  BracketsTabDndSnapshot & {
    tournamentId: string;
    divisions: Array<DivisionData>;
    readOnly: boolean;
    tournamentStatus: string;
    isDraft: boolean;
    selectedDivisionId: string | null;
    setSelectedDivisionId: Dispatch<SetStateAction<string | null>>;
    selectedMatch: MatchData | null;
    setSelectedMatch: Dispatch<SetStateAction<MatchData | null>>;
    panelOpen: boolean;
    setPanelOpen: Dispatch<SetStateAction<boolean>>;
    arenaOrderSheetOpen: boolean;
    setArenaOrderSheetOpen: Dispatch<SetStateAction<boolean>>;
    handleSlotClick: (match: MatchData) => void;
    matchDetail: MatchData | null;
    /** Pool drop target enabled (division has matches). */
    slotReturnEnabled: boolean;
    /** Hint under pool / empty states when athletes can be dragged back from bracket. */
    showArrangedHint: boolean;
  };

export const TournamentBracketContext = createContext<
  TournamentBracketContextValue | undefined
>(undefined);
