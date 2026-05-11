import {
  createTournament,
  getTournament,
  listTournaments,
  removeTournament,
  setTournamentStatus,
  updateTournament,
} from './tournaments';

import {
  createGroup,
  getGroup,
  listGroups,
  removeGroup,
  updateGroup,
} from './groups';

import { createMatch, listMatches, removeMatch, updateMatch } from './matches';

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
  },
  match: {
    list: listMatches,
    create: createMatch,
    update: updateMatch,
    delete: removeMatch,
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
