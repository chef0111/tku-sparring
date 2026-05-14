import type { SetLastSelectionDTO } from '@/orpc/device-last-selection/dto';
import type { HeartbeatLeaseDTO, ReleaseLeaseDTO } from '@/orpc/lease/dto';
import type { SetWinnerDTO, UpdateScoreDTO } from '@/orpc/matches/dto';

export type ArenaMutation =
  | { kind: 'match.updateScore'; payload: UpdateScoreDTO }
  | { kind: 'match.setWinner'; payload: SetWinnerDTO }
  | { kind: 'lease.heartbeat'; payload: HeartbeatLeaseDTO }
  | { kind: 'lease.release'; payload: ReleaseLeaseDTO }
  | { kind: 'device.lastSelection.set'; payload: SetLastSelectionDTO };

export type ArenaMutationRow = {
  id: number;
  kind: ArenaMutation['kind'];
  payload: unknown;
  createdAt: number;
  attempts: number;
};
