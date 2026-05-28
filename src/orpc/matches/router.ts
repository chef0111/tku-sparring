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
} from './index';

export const matchRouter = {
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
} as const;

export const bracketRouter = {
  generate: generateBracketEndpoint,
  shuffle: shuffleBracketEndpoint,
  regenerate: regenerateBracketEndpoint,
  reset: resetBracketEndpoint,
} as const;
