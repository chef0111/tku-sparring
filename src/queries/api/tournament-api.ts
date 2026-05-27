import type {
  CreateTournamentDTO,
  EnsureArenaSlotDTO,
  ListTournamentsDTO,
  MoveGroupArenaDTO,
  RetireArenaDTO,
  SetArenaGroupOrderDTO,
  SetTournamentStatusDTO,
  UpdateTournamentDTO,
} from '@/orpc/tournaments/dto';
import { client } from '@/orpc/client';

export function listTournaments(input: ListTournamentsDTO) {
  return client.tournament.list(input);
}

export function getTournament(id: string) {
  return client.tournament.get({ id });
}

export function createTournament(data: CreateTournamentDTO) {
  return client.tournament.create(data);
}

export function updateTournament(data: UpdateTournamentDTO) {
  return client.tournament.update(data);
}

export function setArenaGroupOrder(input: SetArenaGroupOrderDTO) {
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

export function setTournamentStatus(data: SetTournamentStatusDTO) {
  return client.tournament.setStatus(data);
}

export function deleteTournament(data: { id: string }) {
  return client.tournament.delete(data);
}
