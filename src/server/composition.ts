import { matchTransitionStore } from '@/server/infrastructure/matches';

export const serverRepos = {
  matchTransition: matchTransitionStore,
} as const;

export type ServerRepos = typeof serverRepos;
