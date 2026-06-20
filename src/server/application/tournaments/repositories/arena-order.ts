import type {
  EnsureArenaSlotCommand,
  MoveDivisionArenaCommand,
  RetireArenaCommand,
  SetArenaDivisionOrderCommand,
} from '../use-cases/arena-order-commands';

export type ArenaOrderTournament = {
  id: string;
  status: string;
  arenaDivisionOrder: unknown;
  divisions: Array<{ id: string; arenaIndex: number }>;
};

export type TournamentArenaOrderStore = {
  findTournament: (
    tournamentId: string
  ) => Promise<ArenaOrderTournament | null>;
  setArenaDivisionOrder: (
    command: SetArenaDivisionOrderCommand,
    tournament: ArenaOrderTournament
  ) => Promise<unknown>;
  moveDivisionBetweenArenas: (
    command: MoveDivisionArenaCommand,
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
