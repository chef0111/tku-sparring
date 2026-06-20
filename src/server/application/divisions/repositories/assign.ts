import type { MutationActivityInput } from '@/server/application/activity/activity-types';
import type {
  AssignAthleteCommand,
  AutoAssignAllCommand,
  AutoAssignCommand,
  UnassignAthleteCommand,
} from '../use-cases/assign-commands';

export type DivisionAssignContext = {
  id: string;
  tournamentId: string;
  tournamentStatus: string;
  gender: string | null;
  beltMin: number | null;
  beltMax: number | null;
  weightMin: number | null;
  weightMax: number | null;
};

export type TournamentAthleteRow = {
  id: string;
  tournamentId: string;
  divisionId: string | null;
  name: string;
  status: string;
};

export type TournamentAthleteAssignContext = {
  id: string;
  tournamentId: string;
};

export type DivisionAssignmentStore = {
  findDivision: (divisionId: string) => Promise<DivisionAssignContext | null>;
  findTournamentAthlete: (
    id: string
  ) => Promise<TournamentAthleteAssignContext | null>;
  assignAthlete: (
    input: AssignAthleteCommand & { activity: MutationActivityInput }
  ) => Promise<TournamentAthleteRow>;
  unassignAthlete: (
    input: UnassignAthleteCommand & { activity: MutationActivityInput }
  ) => Promise<TournamentAthleteRow>;
  autoAssign: (
    input: AutoAssignCommand & { activity: MutationActivityInput }
  ) => Promise<{ assigned: number }>;
  autoAssignAll: (command: AutoAssignAllCommand) => Promise<{
    assigned: number;
    divisionsRun: number;
    divisionsSkipped: number;
  }>;
  findTournament: (tournamentId: string) => Promise<{ status: string } | null>;
};
