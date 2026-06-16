import {
  adminSetMatchStatus,
  assignSlot,
  createCustomMatch,
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
  updateScore,
} from './index';

export const matchRouter = {
  list: listMatches,
  get: getMatch,
  createCustom: createCustomMatch,
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
