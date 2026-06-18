import type {
  GetLastSelectionQuery,
  LastSelectionPayload,
  SetLastSelectionCommand,
} from '../use-cases/commands';

export type DeviceLastSelectionStore = {
  find: (query: GetLastSelectionQuery) => Promise<LastSelectionPayload | null>;
  findMatchContext: (
    matchId: string
  ) => Promise<{ groupId: string; tournamentId: string } | null>;
  findGroupContext: (
    groupId: string
  ) => Promise<{ tournamentId: string } | null>;
  existsTournament: (tournamentId: string) => Promise<boolean>;
  upsert: (command: SetLastSelectionCommand) => Promise<LastSelectionPayload>;
};
