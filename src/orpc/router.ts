import {
  createTournament,
  getTournament,
  listTournaments,
  removeTournament,
  setTournamentStatus,
  updateTournament,
} from './tournaments';

import {
  assignAthleteToGroup,
  autoAssignGroup,
  createGroup,
  getGroup,
  listGroups,
  removeGroup,
  unassignAthleteFromGroup,
  updateGroup,
} from './groups';

import {
  createMatch,
  generateBracketEndpoint,
  getMatch,
  listMatches,
  regenerateBracketEndpoint,
  removeMatch,
  setLockEndpoint,
  setWinnerEndpoint,
  shuffleBracketEndpoint,
  swapParticipantsEndpoint,
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
import {
  acquire as acquireLease,
  heartbeat as heartbeatLease,
  listForTournamentLeases,
  release as releaseLease,
  requestTakeover,
  respondTakeover,
} from './lease';

export default {
  tournament: {
    list: listTournaments,
    get: getTournament,
    create: createTournament,
    update: updateTournament,
    setStatus: setTournamentStatus,
    delete: removeTournament,
  },
  group: {
    list: listGroups,
    get: getGroup,
    create: createGroup,
    update: updateGroup,
    delete: removeGroup,
    autoAssign: autoAssignGroup,
    assignAthlete: assignAthleteToGroup,
    unassignAthlete: unassignAthleteFromGroup,
  },
  match: {
    list: listMatches,
    get: getMatch,
    create: createMatch,
    update: updateMatch,
    delete: removeMatch,
    updateScore: updateScoreEndpoint,
    setWinner: setWinnerEndpoint,
    swapParticipants: swapParticipantsEndpoint,
    setLock: setLockEndpoint,
  },
  bracket: {
    generate: generateBracketEndpoint,
    shuffle: shuffleBracketEndpoint,
    regenerate: regenerateBracketEndpoint,
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
  lease: {
    acquire: acquireLease,
    heartbeat: heartbeatLease,
    release: releaseLease,
    requestTakeover,
    respondTakeover,
    listForTournament: listForTournamentLeases,
  },
};
