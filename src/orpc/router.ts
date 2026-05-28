import { tournamentRouter } from './tournaments/router';

import { groupRouter } from './groups/router';

import { bracketRouter, matchRouter } from './matches/router';

import {
  bulkDeleteAthleteProfiles,
  checkDuplicate,
  createAthleteProfile,
  listAthleteProfiles,
  removeAthleteProfile,
  updateAthleteProfile,
} from './athlete-profiles';

import {
  bulkAddAthletes,
  bulkRemoveTournamentAthleteRecords,
  listTournamentAthletes,
  removeTournamentAthleteRecord,
  updateTournamentAthleteRecord,
} from './tournament-athletes';
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
  athleteProfile: {
    list: listAthleteProfiles,
    create: createAthleteProfile,
    checkDuplicate,
    update: updateAthleteProfile,
    delete: removeAthleteProfile,
    bulkDelete: bulkDeleteAthleteProfiles,
  },
  tournamentAthlete: {
    list: listTournamentAthletes,
    bulkAdd: bulkAddAthletes,
    update: updateTournamentAthleteRecord,
    remove: removeTournamentAthleteRecord,
    bulkRemove: bulkRemoveTournamentAthleteRecords,
  },
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
