import type { ListActivityQuery } from '../use-cases/list-commands';

export type ActivityListItem = {
  id: string;
  createdAt: Date;
  eventType: string;
  adminId: string;
  adminName: string;
  entityType: string;
  entityId: string;
  payload: unknown;
  summary: string;
};

export type ActivityListPage = {
  items: Array<ActivityListItem>;
  nextCursor: { id: string } | null;
};

export type ActivityListStore = {
  list: (query: ListActivityQuery) => Promise<ActivityListPage>;
};
