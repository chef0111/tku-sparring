export type AssignAthleteCommand = {
  groupId: string;
  tournamentAthleteId: string;
  adminId: string;
};

export type UnassignAthleteCommand = {
  tournamentAthleteId: string;
  adminId: string;
};

export type AutoAssignCommand = {
  tournamentId: string;
  groupId: string;
  adminId: string;
};

export type AutoAssignAllCommand = {
  tournamentId: string;
  adminId: string;
};
