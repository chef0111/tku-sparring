import type {
  EnsureArenaSlotCommand,
  MoveGroupArenaCommand,
  RetireArenaCommand,
  SetArenaGroupOrderCommand,
} from '../use-cases/arena-order-commands';

export type ArenaOrderTournament = {
  id: string;
  status: string;
  arenaGroupOrder: unknown;
  groups: Array<{ id: string; arenaIndex: number }>;
};

export type TournamentArenaOrderStore = {
  findTournament: (
    tournamentId: string
  ) => Promise<ArenaOrderTournament | null>;
  setArenaGroupOrder: (
    command: SetArenaGroupOrderCommand,
    tournament: ArenaOrderTournament
  ) => Promise<unknown>;
  moveGroupBetweenArenas: (
    command: MoveGroupArenaCommand,
    tournament: ArenaOrderTournament
  ) => Promise<unknown>;
  ensureArenaSlot: (
    command: EnsureArenaSlotCommand,
    tournament: ArenaOrderTournament
  ) => Promise<unknown>;
  retireArena: (
    command: RetireArenaCommand,
    tournament: ArenaOrderTournament
  ) => Promise<unknown>;
};
