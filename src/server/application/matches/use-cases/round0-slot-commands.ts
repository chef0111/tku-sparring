export type SetLockCommand = {
  matchId: string;
  side: 'red' | 'blue';
  locked: boolean;
};

export type AssignSlotCommand = {
  matchId: string;
  side: 'red' | 'blue';
  tournamentAthleteId: string | null;
  adminId: string;
};

export type SwapSlotsCommand = {
  matchAId: string;
  sideA: 'red' | 'blue';
  matchBId: string;
  sideB: 'red' | 'blue';
  adminId: string;
};
