import type {
  CreateTournamentDTO,
  EnsureArenaSlotDTO,
  ListTournamentsDTO,
  MoveDivisionArenaDTO,
  RetireArenaDTO,
  SetArenaDivisionOrderDTO,
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

export function setArenaDivisionOrder(input: SetArenaDivisionOrderDTO) {
  return client.tournament.setArenaDivisionOrder(input);
}

export function moveDivisionArena(input: MoveDivisionArenaDTO) {
  return client.tournament.moveDivisionArena(input);
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
