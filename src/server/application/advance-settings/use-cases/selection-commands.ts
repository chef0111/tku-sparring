export type SelectionCatalogQuery = {
  tournamentId?: string | null;
};

export type SelectionMatchesQuery = {
  tournamentId: string;
  groupId: string;
  deviceId: string;
};
