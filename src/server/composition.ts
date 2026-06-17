import {
  customMatchStore,
  matchTransitionStore,
} from '@/server/infrastructure/matches';
import {
  groupAssignmentStore,
  groupLifecycleStore,
} from '@/server/infrastructure/groups';

export const serverRepos = {
  matchTransition: matchTransitionStore,
  customMatch: customMatchStore,
  groupLifecycle: groupLifecycleStore,
  groupAssign: groupAssignmentStore,
} as const;

export type ServerRepos = typeof serverRepos;
