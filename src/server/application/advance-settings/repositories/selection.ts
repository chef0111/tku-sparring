import type {
  SelectionGroupRow,
  SelectionMatchRow,
} from '@/contracts/advance/selection';
import type {
  SelectionCatalogQuery,
  SelectionMatchesQuery,
} from '../use-cases/selection-commands';

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
