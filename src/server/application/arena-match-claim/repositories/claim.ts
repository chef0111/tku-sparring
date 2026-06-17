import type {
  ClaimMatchCommand,
  ReleaseClaimCommand,
} from '../use-cases/claim-commands';

export type ArenaMatchClaimStore = {
  claim: (command: ClaimMatchCommand) => Promise<unknown>;
  release: (command: ReleaseClaimCommand) => Promise<{ removed: boolean }>;
};
