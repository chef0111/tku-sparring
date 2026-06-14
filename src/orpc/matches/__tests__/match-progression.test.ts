import { beforeEach, describe, expect, it, vi } from 'vitest';

import { advanceWinner } from '../match-progression';

const db = {
  match: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  tournamentAthlete: {
    findUnique: vi.fn(),
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('advanceWinner', () => {
  it('writes winner to the red side of the successor match', async () => {
    vi.mocked(db.match.findUnique).mockResolvedValue({
      id: 'm-r0-0',
      kind: 'bracket',
      groupId: 'group-1',
      round: 0,
      matchIndex: 0,
    } as never);

    vi.mocked(db.tournamentAthlete.findUnique).mockResolvedValue({
      id: 'ta-red',
      athleteProfileId: 'ap-red',
    } as never);

    vi.mocked(db.match.findFirst).mockResolvedValue({
      id: 'm-r1-0',
      cornersSwapped: false,
      redTournamentAthleteId: null,
      blueTournamentAthleteId: null,
    } as never);

    vi.mocked(db.match.update).mockResolvedValue({} as never);

    await advanceWinner('m-r0-0', 'ta-red', db as never);

    expect(db.match.findFirst).toHaveBeenCalledWith({
      where: {
        kind: 'bracket',
        groupId: 'group-1',
        round: 1,
        matchIndex: 0,
      },
    });

    expect(db.match.update).toHaveBeenCalledWith({
      where: { id: 'm-r1-0' },
      data: {
        redTournamentAthleteId: 'ta-red',
        redAthleteId: 'ap-red',
      },
    });
  });

  it('writes winner to the blue side when feeder match index is odd', async () => {
    vi.mocked(db.match.findUnique).mockResolvedValue({
      id: 'm-r0-1',
      kind: 'bracket',
      groupId: 'group-1',
      round: 0,
      matchIndex: 1,
    } as never);

    vi.mocked(db.tournamentAthlete.findUnique).mockResolvedValue({
      id: 'ta-blue',
      athleteProfileId: 'ap-blue',
    } as never);

    vi.mocked(db.match.findFirst).mockResolvedValue({
      id: 'm-r1-0',
      cornersSwapped: false,
    } as never);

    vi.mocked(db.match.update).mockResolvedValue({} as never);

    await advanceWinner('m-r0-1', 'ta-blue', db as never);

    expect(db.match.update).toHaveBeenCalledWith({
      where: { id: 'm-r1-0' },
      data: {
        blueTournamentAthleteId: 'ta-blue',
        blueAthleteId: 'ap-blue',
      },
    });
  });

  it('skips custom matches', async () => {
    vi.mocked(db.match.findUnique).mockResolvedValue({
      id: 'custom-1',
      kind: 'custom',
      groupId: 'group-1',
      round: 900,
      matchIndex: 0,
    } as never);

    await advanceWinner('custom-1', 'ta-red', db as never);

    expect(db.match.findFirst).not.toHaveBeenCalled();
    expect(db.match.update).not.toHaveBeenCalled();
  });

  it('no-ops when successor match does not exist', async () => {
    vi.mocked(db.match.findUnique).mockResolvedValue({
      id: 'm-r0-0',
      kind: 'bracket',
      groupId: 'group-1',
      round: 0,
      matchIndex: 0,
    } as never);

    vi.mocked(db.tournamentAthlete.findUnique).mockResolvedValue({
      id: 'ta-red',
      athleteProfileId: 'ap-red',
    } as never);

    vi.mocked(db.match.findFirst).mockResolvedValue(null);

    await advanceWinner('m-r0-0', 'ta-red', db as never);

    expect(db.match.update).not.toHaveBeenCalled();
  });

  it('writes winner to the opposite corner when successor has cornersSwapped', async () => {
    vi.mocked(db.match.findUnique).mockResolvedValue({
      id: 'm-r0-0',
      kind: 'bracket',
      groupId: 'group-1',
      round: 0,
      matchIndex: 0,
    } as never);

    vi.mocked(db.tournamentAthlete.findUnique).mockResolvedValue({
      id: 'ta-red',
      athleteProfileId: 'ap-red',
    } as never);

    vi.mocked(db.match.findFirst).mockResolvedValue({
      id: 'm-r1-0',
      cornersSwapped: true,
      redTournamentAthleteId: null,
      blueTournamentAthleteId: null,
    } as never);

    vi.mocked(db.match.update).mockResolvedValue({} as never);

    await advanceWinner('m-r0-0', 'ta-red', db as never);

    expect(db.match.update).toHaveBeenCalledWith({
      where: { id: 'm-r1-0' },
      data: {
        blueTournamentAthleteId: 'ta-red',
        blueAthleteId: 'ap-red',
      },
    });
  });
});
