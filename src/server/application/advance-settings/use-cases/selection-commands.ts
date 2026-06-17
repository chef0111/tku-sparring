export type SelectionCatalogQuery = {
  tournamentId?: string;
};

export type SelectionMatchesQuery = {
  tournamentId: string;
  groupId: string;
  deviceId: string;
};
