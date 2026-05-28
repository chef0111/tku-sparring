import {
  adminSetMatchStatus,
  assignSlot,
  createCustomMatch,
  createMatch,
  generateBracket,
  getMatch,
  listMatches,
  regenerateBracket,
  removeMatch,
  resetBracket,
  setLock,
  setWinner,
  shuffleBracket,
  swapParticipants,
  swapSlots,
  updateMatch,
  updateScore,
} from './index';

export const matchRouter = {
  list: listMatches,
  get: getMatch,
  create: createMatch,
  createCustom: createCustomMatch,
  update: updateMatch,
  adminSetMatchStatus,
  delete: removeMatch,
  updateScore,
  setWinner,
  swapParticipants,
  setLock,
  assignSlot,
  swapSlots,
} as const;

export const bracketRouter = {
  generate: generateBracket,
  shuffle: shuffleBracket,
  regenerate: regenerateBracket,
  reset: resetBracket,
} as const;
