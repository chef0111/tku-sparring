import type {
  CreateGroupCommand,
  DeleteGroupCommand,
  UpdateGroupCommand,
} from '../use-cases/lifecycle-commands';

export type GroupRow = {
  id: string;
  name: string;
  tournamentId: string;
  gender: string | null;
  beltMin: number | null;
  beltMax: number | null;
  weightMin: number | null;
  weightMax: number | null;
  thirdPlaceMatch: boolean;
  arenaIndex: number;
  createdAt: Date;
  updatedAt: Date;
};

export type GroupLifecycleStore = {
  findTournament: (tournamentId: string) => Promise<{ status: string } | null>;
  findGroup: (id: string) => Promise<{
    id: string;
    tournamentId: string;
    tournamentStatus: string;
  } | null>;
  create: (command: CreateGroupCommand) => Promise<GroupRow>;
  update: (command: UpdateGroupCommand) => Promise<GroupRow>;
  delete: (command: DeleteGroupCommand) => Promise<GroupRow>;
};
