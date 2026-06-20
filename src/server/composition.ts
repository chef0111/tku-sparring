import {
  bracketLifecycleStore,
  customMatchStore,
  matchParticipantStore,
  matchReadStore,
  matchTransitionStore,
  round0SlotStore,
} from '@/server/infrastructure/matches';
import {
  divisionAssignmentStore,
  divisionLifecycleStore,
  divisionReadStore,
} from '@/server/infrastructure/divisions';
import {
  tournamentArenaOrderStore,
  tournamentLifecycleStore,
  tournamentReadStore,
} from '@/server/infrastructure/tournaments';
import { tournamentAthleteStore } from '@/server/infrastructure/tournament-athletes';
import { advanceSelectionStore } from '@/server/infrastructure/advance-settings';
import { deviceLastSelectionStore } from '@/server/infrastructure/device-last-selection';
import { arenaMatchClaimStore } from '@/server/infrastructure/arena-match-claim';
import { activityListStore } from '@/server/infrastructure/activity';
import { athleteProfileStore } from '@/server/infrastructure/athlete-profiles';

export const serverRepos = {
  matchTransition: matchTransitionStore,
  customMatch: customMatchStore,
  bracketLifecycle: bracketLifecycleStore,
  round0Slot: round0SlotStore,
  matchParticipant: matchParticipantStore,
  divisionLifecycle: divisionLifecycleStore,
  divisionAssign: divisionAssignmentStore,
  divisionRead: divisionReadStore,
  tournamentLifecycle: tournamentLifecycleStore,
  tournamentArenaOrder: tournamentArenaOrderStore,
  tournamentAthlete: tournamentAthleteStore,
  advanceSelection: advanceSelectionStore,
  deviceLastSelection: deviceLastSelectionStore,
  arenaMatchClaim: arenaMatchClaimStore,
  activityList: activityListStore,
  athleteProfile: athleteProfileStore,
  tournamentRead: tournamentReadStore,
  matchRead: matchReadStore,
} as const;

export type ServerRepos = typeof serverRepos;
