export type ListActivityQuery = {
  tournamentId: string;
  eventTypes?: Array<string>;
  cursor?: { id: string };
  limit?: number;
};
