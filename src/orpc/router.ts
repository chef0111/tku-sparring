import { tournamentRouter } from './tournaments/router';

import {
  assignAthleteToGroup,
  autoAssignAllGroups,
  autoAssignGroup,
  createGroup,
  getGroup,
  listGroups,
  removeGroup,
  unassignAthleteFromGroup,
  updateGroup,
} from './groups';

import {
  adminSetMatchStatusEndpoint,
  assignSlotEndpoint,
  createCustomMatch,
  createMatch,
  generateBracketEndpoint,
  getMatch,
  listMatches,
  regenerateBracketEndpoint,
  removeMatch,
  resetBracketEndpoint,
  setLockEndpoint,
  setWinnerEndpoint,
  shuffleBracketEndpoint,
  swapParticipantsEndpoint,
  swapSlotsEndpoint,
  updateMatch,
  updateScoreEndpoint,
} from './matches';

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
  group: {
    list: listGroups,
    get: getGroup,
    create: createGroup,
    update: updateGroup,
    delete: removeGroup,
    autoAssign: autoAssignGroup,
    autoAssignAll: autoAssignAllGroups,
    assignAthlete: assignAthleteToGroup,
    unassignAthlete: unassignAthleteFromGroup,
  },
  match: {
    list: listMatches,
    get: getMatch,
    create: createMatch,
    createCustom: createCustomMatch,
    update: updateMatch,
    adminSetMatchStatus: adminSetMatchStatusEndpoint,
    delete: removeMatch,
    updateScore: updateScoreEndpoint,
    setWinner: setWinnerEndpoint,
    swapParticipants: swapParticipantsEndpoint,
    setLock: setLockEndpoint,
    assignSlot: assignSlotEndpoint,
    swapSlots: swapSlotsEndpoint,
  },
  bracket: {
    generate: generateBracketEndpoint,
    shuffle: shuffleBracketEndpoint,
    regenerate: regenerateBracketEndpoint,
    reset: resetBracketEndpoint,
  },
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
