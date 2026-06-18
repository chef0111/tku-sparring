import type {
  CreateTournamentCommand,
  DeleteTournamentCommand,
  SetTournamentStatusCommand,
  UpdateTournamentCommand,
} from '../use-cases/lifecycle-commands';
import type { TournamentStatusValue } from '@/lib/tournament/tournament-status';

export type TournamentRow = {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TournamentLifecycleContext = {
  id: string;
  status: string;
  lifecycle: { canComplete: boolean };
};

export type ApplyTournamentStatusInput = SetTournamentStatusCommand & {
  fromStatus: TournamentStatusValue;
};

export type TournamentLifecycleStore = {
  findWithLifecycle: (id: string) => Promise<TournamentLifecycleContext | null>;
  findStatus: (id: string) => Promise<{ status: string } | null>;
  create: (command: CreateTournamentCommand) => Promise<TournamentRow>;
  update: (command: UpdateTournamentCommand) => Promise<TournamentRow>;
  applyStatus: (input: ApplyTournamentStatusInput) => Promise<TournamentRow>;
  delete: (command: DeleteTournamentCommand) => Promise<TournamentRow>;
};
