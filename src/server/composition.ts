import {
  bracketLifecycleStore,
  customMatchStore,
  matchParticipantStore,
  matchTransitionStore,
  round0SlotStore,
} from '@/server/infrastructure/matches';
import {
  groupAssignmentStore,
  groupLifecycleStore,
} from '@/server/infrastructure/groups';
import {
  tournamentArenaOrderStore,
  tournamentLifecycleStore,
} from '@/server/infrastructure/tournaments';
import { tournamentAthleteStore } from '@/server/infrastructure/tournament-athletes';
import { advanceSelectionStore } from '@/server/infrastructure/advance-settings';

export const serverRepos = {
  matchTransition: matchTransitionStore,
  customMatch: customMatchStore,
  bracketLifecycle: bracketLifecycleStore,
  round0Slot: round0SlotStore,
  matchParticipant: matchParticipantStore,
  groupLifecycle: groupLifecycleStore,
  groupAssign: groupAssignmentStore,
  tournamentLifecycle: tournamentLifecycleStore,
  tournamentArenaOrder: tournamentArenaOrderStore,
  tournamentAthlete: tournamentAthleteStore,
  advanceSelection: advanceSelectionStore,
} as const;

export type ServerRepos = typeof serverRepos;
