export type SetArenaDivisionOrderCommand = {
  tournamentId: string;
  arenaIndex: number;
  divisionIds: Array<string>;
};

export type MoveDivisionArenaCommand = {
  tournamentId: string;
  divisionId: string;
  fromArena: number;
  toArena: number;
  insertIndex: number;
};

export type EnsureArenaSlotCommand = {
  tournamentId: string;
  arenaIndex: number;
};

export type RetireArenaCommand = {
  tournamentId: string;
  fromArena: number;
  toArena: number;
};
