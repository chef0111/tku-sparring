import type {
  CreateDivisionCommand,
  DeleteDivisionCommand,
  UpdateDivisionCommand,
} from '../use-cases/lifecycle-commands';

export type DivisionRow = {
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

export type DivisionLifecycleStore = {
  findTournament: (tournamentId: string) => Promise<{ status: string } | null>;
  findDivision: (id: string) => Promise<{
    id: string;
    tournamentId: string;
    tournamentStatus: string;
  } | null>;
  create: (command: CreateDivisionCommand) => Promise<DivisionRow>;
  update: (command: UpdateDivisionCommand) => Promise<DivisionRow>;
  delete: (command: DeleteDivisionCommand) => Promise<DivisionRow>;
};
