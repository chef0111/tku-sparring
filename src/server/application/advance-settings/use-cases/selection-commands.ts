export type SelectionCatalogQuery = {
  tournamentId?: string | null;
};

export type SelectionMatchesQuery = {
  tournamentId: string;
  divisionId: string;
  deviceId: string;
};
