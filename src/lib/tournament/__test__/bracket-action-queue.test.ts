import { describe, expect, it } from 'vitest';
import { buildBracketActionQueue } from '../bracket-action-queue';
import type { BracketActionQueueItem } from '../bracket-action-queue';
import type { MatchData } from '@/features/dashboard/types';

function baseMatch(over: Partial<MatchData>): MatchData {
  return {
    id: over.id ?? 'm1',
    kind: over.kind ?? 'bracket',
    displayLabel: over.displayLabel ?? null,
    round: over.round ?? 0,
    matchIndex: over.matchIndex ?? 0,
    status: over.status ?? 'pending',
    redAthleteId: over.redAthleteId ?? null,
    blueAthleteId: over.blueAthleteId ?? null,
    redTournamentAthleteId: over.redTournamentAthleteId ?? null,
    blueTournamentAthleteId: over.blueTournamentAthleteId ?? null,
    redWins: over.redWins ?? 0,
    blueWins: over.blueWins ?? 0,
    winnerId: over.winnerId ?? null,
    tournamentWinnerId: over.tournamentWinnerId ?? null,
    redLocked: over.redLocked ?? false,
    blueLocked: over.blueLocked ?? false,
    updatedAt: over.updatedAt ?? new Date(0),
    groupId: over.groupId ?? 'g1',
    tournamentId: over.tournamentId ?? 't1',
  };
}

describe('buildBracketActionQueue', () => {
  it('skips matches with both athletes empty', () => {
    const matches = [
      baseMatch({ id: 'a', round: 0, matchIndex: 0 }),
      baseMatch({
        id: 'b',
        round: 0,
        matchIndex: 1,
        redTournamentAthleteId: 'r1',
        blueTournamentAthleteId: 'b1',
      }),
    ];
    const q = buildBracketActionQueue(matches);
    expect(q.map((x: BracketActionQueueItem) => x.match.id)).toEqual(['b']);
  });

  it('sorts by round then matchIndex', () => {
    const matches = [
      baseMatch({
        id: 'later',
        round: 1,
        matchIndex: 0,
        redTournamentAthleteId: 'r',
        blueTournamentAthleteId: 'b',
      }),
      baseMatch({
        id: 'earlier',
        round: 0,
        matchIndex: 0,
        redTournamentAthleteId: 'r2',
        blueTournamentAthleteId: 'b2',
      }),
    ];
    const q = buildBracketActionQueue(matches);
    expect(q.map((x: BracketActionQueueItem) => x.match.id)).toEqual([
      'earlier',
      'later',
    ]);
  });

  it('lists bracket rows with status subtitle', () => {
    const matches = [
      baseMatch({
        id: 'm',
        round: 0,
        matchIndex: 0,
        redTournamentAthleteId: 'r',
        blueTournamentAthleteId: 'b',
        tournamentWinnerId: null,
        status: 'pending',
      }),
    ];
    const q = buildBracketActionQueue(matches);
    expect(q).toHaveLength(1);
    expect(q[0]!.reasons).toEqual(['Pending']);
  });

  it('lists completed bracket matches', () => {
    const matches = [
      baseMatch({
        id: 'm',
        round: 0,
        matchIndex: 0,
        redTournamentAthleteId: 'r',
        blueTournamentAthleteId: 'b',
        tournamentWinnerId: 'wta',
        status: 'complete',
      }),
    ];
    const q = buildBracketActionQueue(matches);
    expect(q).toHaveLength(1);
    expect(q[0]!.reasons).toEqual(['Complete']);
  });

  it('includes one-sided empty for later rounds when not phantom-fed', () => {
    const matches = [
      baseMatch({
        id: 'sf',
        round: 1,
        matchIndex: 0,
        redTournamentAthleteId: 'r',
        blueTournamentAthleteId: null,
      }),
    ];
    const q = buildBracketActionQueue(matches);
    expect(q).toHaveLength(1);
    expect(q[0]!.reasons).toEqual(['Pending']);
  });

  it('omits round-0 structural BYE rows (Advanced)', () => {
    const matches = [
      baseMatch({
        id: 'bye',
        round: 0,
        matchIndex: 0,
        redTournamentAthleteId: 'ta1',
        blueTournamentAthleteId: null,
      }),
      baseMatch({
        id: 'open',
        round: 0,
        matchIndex: 1,
        redTournamentAthleteId: 'ta2',
        blueTournamentAthleteId: null,
      }),
    ];
    const q = buildBracketActionQueue(matches, { groupAthleteCount: 3 });
    expect(q.map((x) => x.match.id)).toEqual([]);
  });

  it('omits completed structural BYE rows', () => {
    const matches = [
      baseMatch({
        id: 'bye-done',
        round: 0,
        matchIndex: 0,
        redTournamentAthleteId: 'ta1',
        blueTournamentAthleteId: null,
        tournamentWinnerId: 'ta1',
        status: 'complete',
      }),
      baseMatch({
        id: 'open',
        round: 0,
        matchIndex: 1,
        redTournamentAthleteId: 'ta2',
        blueTournamentAthleteId: null,
      }),
    ];
    const q = buildBracketActionQueue(matches, { groupAthleteCount: 3 });
    expect(q.map((x) => x.match.id)).toEqual([]);
  });

  it('omits completed phantom-fed upper row (Advanced)', () => {
    const matches = [
      baseMatch({
        id: 'r0-0',
        round: 0,
        matchIndex: 0,
        redTournamentAthleteId: 'a',
        blueTournamentAthleteId: 'b',
      }),
      baseMatch({ id: 'r0-1', round: 0, matchIndex: 1 }),
      baseMatch({
        id: 'sf',
        round: 1,
        matchIndex: 0,
        redTournamentAthleteId: 'w',
        blueTournamentAthleteId: null,
        tournamentWinnerId: 'w',
        status: 'complete',
      }),
    ];
    const q = buildBracketActionQueue(matches);
    expect(q.some((x) => x.match.id === 'sf')).toBe(false);
  });

  it('omits upper-round slots fed by one phantom round-0 row', () => {
    const matches = [
      baseMatch({
        id: 'r0-0',
        round: 0,
        matchIndex: 0,
        redTournamentAthleteId: 'a',
        blueTournamentAthleteId: 'b',
      }),
      baseMatch({ id: 'r0-1', round: 0, matchIndex: 1 }),
      baseMatch({
        id: 'sf',
        round: 1,
        matchIndex: 0,
        redTournamentAthleteId: 'w',
        blueTournamentAthleteId: null,
      }),
    ];
    const q = buildBracketActionQueue(matches);
    expect(q.map((x) => x.match.id)).not.toContain('sf');
  });

  it('lists custom matches first with Custom match + status', () => {
    const matches = [
      baseMatch({
        id: 'bracket',
        kind: 'bracket',
        round: 0,
        matchIndex: 0,
        redTournamentAthleteId: 'r',
        blueTournamentAthleteId: 'b1',
      }),
      baseMatch({
        id: 'custom',
        kind: 'custom',
        round: 900,
        matchIndex: 0,
        displayLabel: 'Bronze',
        redTournamentAthleteId: 'r2',
        blueTournamentAthleteId: 'b2',
        tournamentWinnerId: null,
        status: 'pending',
      }),
    ];
    const q = buildBracketActionQueue(matches);
    expect(q.map((x) => x.match.id)).toEqual(['custom', 'bracket']);
    expect(q[0]!.reasons).toEqual(['Custom match', 'Pending']);
    expect(q[1]!.reasons).toEqual(['Pending']);
  });

  it('includes finished custom matches', () => {
    const q = buildBracketActionQueue([
      baseMatch({
        id: 'c',
        kind: 'custom',
        round: 900,
        redTournamentAthleteId: 'r',
        blueTournamentAthleteId: 'b',
        tournamentWinnerId: 'w',
        status: 'complete',
      }),
    ]);
    expect(q).toHaveLength(1);
    expect(q[0]!.reasons).toEqual(['Custom match', 'Complete']);
  });
});
