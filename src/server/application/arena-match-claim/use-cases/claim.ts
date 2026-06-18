import type { ArenaMatchClaimStore } from '../repositories/claim';
import type { ClaimMatchCommand } from './claim-commands';

export async function claimMatch(
  command: ClaimMatchCommand,
  store: ArenaMatchClaimStore
) {
  return store.claim(command);
}
