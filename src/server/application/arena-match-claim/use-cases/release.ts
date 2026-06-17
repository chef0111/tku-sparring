import type { ArenaMatchClaimStore } from '../repositories/claim';
import type { ReleaseClaimCommand } from './claim-commands';

export async function releaseClaim(
  command: ReleaseClaimCommand,
  store: ArenaMatchClaimStore
) {
  return store.release(command);
}
