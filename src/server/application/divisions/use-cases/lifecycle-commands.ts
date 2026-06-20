export type CreateDivisionCommand = {
  name: string;
  tournamentId: string;
};

export type UpdateDivisionCommand = {
  id: string;
  name?: string;
  thirdPlaceMatch?: boolean;
  gender?: 'M' | 'F' | null;
  beltMin?: number | null;
  beltMax?: number | null;
  weightMin?: number | null;
  weightMax?: number | null;
};

export type DeleteDivisionCommand = {
  id: string;
};
