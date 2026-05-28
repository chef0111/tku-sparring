import { getLastSelection, setLastSelection } from './index';

export const deviceLastSelectionRouter = {
  get: getLastSelection,
  set: setLastSelection,
} as const;
