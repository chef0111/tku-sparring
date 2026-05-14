import { deleteById, incrementAttempts, peekOrdered } from './queue';
import type { SetLastSelectionDTO } from '@/orpc/device-last-selection/dto';
import type { HeartbeatLeaseDTO, ReleaseLeaseDTO } from '@/orpc/lease/dto';
import type { SetWinnerDTO, UpdateScoreDTO } from '@/orpc/matches/dto';

import type { ArenaMutationRow } from './types';
import { client } from '@/orpc/client';

async function dispatchRow(row: ArenaMutationRow) {
  switch (row.kind) {
    case 'match.updateScore':
      await client.match.updateScore(row.payload as UpdateScoreDTO);
      return;
    case 'match.setWinner':
      await client.match.setWinner(row.payload as SetWinnerDTO);
      return;
    case 'lease.heartbeat':
      await client.lease.heartbeat(row.payload as HeartbeatLeaseDTO);
      return;
    case 'lease.release':
      await client.lease.release(row.payload as ReleaseLeaseDTO);
      return;
    case 'device.lastSelection.set':
      await client.device.lastSelection.set(row.payload as SetLastSelectionDTO);
      return;
    default:
      throw new Error('Unknown queued mutation kind');
  }
}

/** FIFO replay; stops on first failure (attempts incremented). */
export async function replayArenaMutationQueue(): Promise<void> {
  const rows = await peekOrdered();

  for (const row of rows) {
    try {
      await dispatchRow(row);
      await deleteById(row.id);
    } catch {
      await incrementAttempts(row.id);
      break;
    }
  }
}
