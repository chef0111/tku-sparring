export type AssignAthleteCommand = {
  divisionId: string;
  tournamentAthleteId: string;
  adminId: string;
};

export type UnassignAthleteCommand = {
  tournamentAthleteId: string;
  adminId: string;
};

export type AutoAssignCommand = {
  tournamentId: string;
  divisionId: string;
  adminId: string;
};

export type AutoAssignAllCommand = {
  tournamentId: string;
  adminId: string;
};
