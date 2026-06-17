import type {
  SelectionCatalogQuery,
  SelectionMatchesQuery,
} from '../use-cases/selection-commands';

export type SelectionGroupRow = {
  id: string;
  name: string;
  tournamentId: string;
  status: 'draft' | 'active' | 'completed';
  arenaIndex: number;
  arenaLabel: string;
};

export type MatchClaimStatus = 'none' | 'held_by_me' | 'held_by_other';

export type SelectionMatchRow = {
  id: string;
  label: string;
  groupId: string;
  status: string;
  redAthleteName: string | null;
  blueAthleteName: string | null;
  redAthleteImage: string | null;
  blueAthleteImage: string | null;
  disabled: boolean;
  claimStatus: MatchClaimStatus;
};

export type SelectionCatalogResult = {
  tournaments: Array<{ id: string; name: string; status: string }>;
  groups: Array<SelectionGroupRow>;
};

export type SelectionMatchesResult = {
  matches: Array<SelectionMatchRow>;
};

export type AdvanceSelectionStore = {
  selectionCatalog: (
    query: SelectionCatalogQuery
  ) => Promise<SelectionCatalogResult>;
  selectionMatches: (
    query: SelectionMatchesQuery
  ) => Promise<SelectionMatchesResult>;
};
