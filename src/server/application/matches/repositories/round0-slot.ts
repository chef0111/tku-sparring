import type {
  MatchLoadRow,
  MatchRead,
} from '@/server/domain/tournament/match/match-read';
import type {
  AssignSlotCommand,
  SetLockCommand,
  SwapSlotsCommand,
} from '../use-cases/round0-slot-commands';

export type Round0SlotStore = {
  findMatch: (matchId: string) => Promise<MatchLoadRow | null>;
  setLock: (command: SetLockCommand) => Promise<MatchRead>;
  assignSlot: (command: AssignSlotCommand) => Promise<MatchRead>;
  swapSlots: (command: SwapSlotsCommand) => Promise<MatchRead>;
};
