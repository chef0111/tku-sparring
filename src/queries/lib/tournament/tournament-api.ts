import type {
  EnsureArenaSlotDTO,
  ListTournamentsDTO,
  MoveGroupArenaDTO,
  RetireArenaDTO,
} from '@/orpc/tournaments/dto';
import type { TournamentStatus } from '@/features/dashboard/types';
import { client } from '@/orpc/client';

export function listTournaments(input: ListTournamentsDTO) {
  return client.tournament.list(input);
}

export function getTournament(id: string) {
  return client.tournament.get({ id });
}

export function createTournament(data: { name: string }) {
  return client.tournament.create(data);
}

export function updateTournament(data: {
  id: string;
  name?: string;
  arenaCount?: number;
  includeThirdPlaceMatch?: boolean;
}) {
  return client.tournament.update(data);
}

export function setArenaGroupOrder(input: {
  tournamentId: string;
  arenaGroupOrder: string;
}) {
  return client.tournament.setArenaGroupOrder(input);
}

export function moveGroupArena(input: MoveGroupArenaDTO) {
  return client.tournament.moveGroupArena(input);
}

export function ensureArenaSlot(input: EnsureArenaSlotDTO) {
  return client.tournament.ensureArenaSlot(input);
}

export function retireArena(input: RetireArenaDTO) {
  return client.tournament.retireArena(input);
}

export function setTournamentStatus(data: {
  id: string;
  status: TournamentStatus;
}) {
  return client.tournament.setStatus(data);
}

export function deleteTournament(data: { id: string }) {
  return client.tournament.delete(data);
}
