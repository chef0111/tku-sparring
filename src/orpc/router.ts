import { tournamentRouter } from './tournaments/router';

import { groupRouter } from './groups/router';

import { bracketRouter, matchRouter } from './matches/router';

import { athleteProfileRouter } from './athlete-profiles/router';

import { tournamentAthleteRouter } from './tournament-athletes/router';
import { listForTournament as listActivityForTournament } from './activity';
import {
  selectionCatalog as advanceSettingsSelectionCatalog,
  selectionMatches as advanceSettingsSelectionMatches,
} from './advance-settings';
import {
  claim as arenaMatchClaim,
  release as arenaMatchClaimRelease,
} from './arena-match-claim';
import { getLastSelection, setLastSelection } from './device-last-selection';

export default {
  tournament: tournamentRouter,
  group: groupRouter,
  match: matchRouter,
  bracket: bracketRouter,
  athleteProfile: athleteProfileRouter,
  tournamentAthlete: tournamentAthleteRouter,
  activity: {
    listForTournament: listActivityForTournament,
  },
  advanceSettings: {
    selectionCatalog: advanceSettingsSelectionCatalog,
    selectionMatches: advanceSettingsSelectionMatches,
  },
  arenaMatchClaim: {
    claim: arenaMatchClaim,
    release: arenaMatchClaimRelease,
  },
  device: {
    lastSelection: {
      get: getLastSelection,
      set: setLastSelection,
    },
  },
};
