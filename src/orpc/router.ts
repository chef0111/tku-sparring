import {
  createTournament,
  getTournament,
  listTournaments,
  removeTournament,
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
  createAthlete,
  createAthletes,
  listAthletes,
  removeAthlete,
  removeAthletes,
  reorderAthletes,
  updateAthlete,
} from './athletes';

export default {
  tournament: {
    list: listTournaments,
    get: getTournament,
    create: createTournament,
    update: updateTournament,
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
  athlete: {
    list: listAthletes,
    create: createAthlete,
    createMany: createAthletes,
    update: updateAthlete,
    delete: removeAthlete,
    deleteMany: removeAthletes,
    reorder: reorderAthletes,
  },
};
