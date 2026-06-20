import type {
  AdminSetMatchStatusDTO,
  AssignSlotDTO,
  CreateCustomMatchDTO,
  GenerateBracketDTO,
  SetLockDTO,
  SetWinnerDTO,
  SwapParticipantsDTO,
  SwapSlotsDTO,
  UpdateScoreDTO,
} from '@/orpc/matches/dto';
import { client } from '@/orpc/client';

export function listMatchesByDivision(divisionId: string) {
  return client.match.list({ divisionId });
}

export function listMatchesByTournament(tournamentId: string) {
  return client.match.list({ tournamentId });
}

export function generateBracket(data: GenerateBracketDTO) {
  return client.bracket.generate(data);
}

export function shuffleBracket(data: { divisionId: string }) {
  return client.bracket.shuffle(data);
}

export function regenerateBracket(data: { divisionId: string }) {
  return client.bracket.regenerate(data);
}

export function resetBracket(data: { divisionId: string }) {
  return client.bracket.reset(data);
}

export function createCustomMatch(data: CreateCustomMatchDTO) {
  return client.match.createCustom(data);
}

export function assignMatchSlot(data: AssignSlotDTO) {
  return client.match.assignSlot(data);
}

export function swapMatchSlots(data: SwapSlotsDTO) {
  return client.match.swapSlots(data);
}

export function setMatchLock(data: SetLockDTO) {
  return client.match.setLock(data);
}

export function updateMatchScore(data: UpdateScoreDTO) {
  return client.match.updateScore(data);
}

export function adminSetMatchStatus(data: AdminSetMatchStatusDTO) {
  return client.match.adminSetMatchStatus(data);
}

export function deleteMatch(data: { id: string }) {
  return client.match.delete(data);
}

export function setMatchWinner(data: SetWinnerDTO) {
  return client.match.setWinner(data);
}

export function swapMatchParticipants(data: SwapParticipantsDTO) {
  return client.match.swapParticipants(data);
}
