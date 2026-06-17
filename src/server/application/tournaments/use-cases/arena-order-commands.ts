export type SetArenaGroupOrderCommand = {
  tournamentId: string;
  arenaIndex: number;
  groupIds: Array<string>;
};

export type MoveGroupArenaCommand = {
  tournamentId: string;
  groupId: string;
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
