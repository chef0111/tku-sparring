import { create } from 'zustand';
import type { PlayerData } from './player-store';
import {
  BO3_MAX_ROUNDS,
  BO3_WINS_NEEDED,
  deriveArenaCurrentRound,
} from '@/lib/tournament/bo3';

interface MatchState {
  matchId: string;
  matchLabel: string;
  currentRound: number;
  maxRounds: number;
  roundWinners: Array<Player | null>;
  redWon: number;
  blueWon: number;
  matchWinner: Player | null;
  isMatchOver: boolean;
  /** Incremented when server-driven score hydration runs (arena reload sync). */
  hydrationGeneration: number;
}

interface MatchActions {
  setMatchDisplay: (input: { id: string; label: string }) => void;
  nextRound: () => void;
  recordRoundWinner: (winner: Player) => void;
  declareWinner: (red: PlayerData, blue: PlayerData) => Player | 'tie';
  resetMatch: () => void;
  resetRound: () => void;
  setMatchOver: (winner: Player) => void;
  closeMatchResult: () => void;
  setMaxRounds: (rounds: number) => void;
  hydrateFromServerScores: (input: {
    redWins: number;
    blueWins: number;
  }) => void;
}

type MatchStore = MatchState & MatchActions;

export const useMatchStore = create<MatchStore>()((set, get) => ({
  matchId: 'Match 001',
  matchLabel: 'MATCH 001',
  currentRound: 1,
  maxRounds: BO3_MAX_ROUNDS,
  roundWinners: [],
  redWon: 0,
  blueWon: 0,
  matchWinner: null,
  isMatchOver: false,
  hydrationGeneration: 0,

  setMatchDisplay: ({ id, label }) => {
    set({ matchId: id, matchLabel: label });
  },

  nextRound: () => {
    const state = get();
    const nextRound = state.currentRound + 1;

    if (nextRound > state.maxRounds) return;

    set({ currentRound: nextRound });
  },

  recordRoundWinner: (winner) => {
    const state = get();
    const roundIndex = state.currentRound - 1;

    const roundWinners = [...state.roundWinners];
    roundWinners[roundIndex] = winner;

    const redWon = winner === 'red' ? state.redWon + 1 : state.redWon;
    const blueWon = winner === 'blue' ? state.blueWon + 1 : state.blueWon;

    set({
      roundWinners,
      redWon,
      blueWon,
    });
  },

  declareWinner: (red, blue): Player | 'tie' => {
    // Check for mana depletion (penalties)
    if (red.mana <= 0 && blue.health > 0 && red.health > 0) return 'blue';
    if (blue.mana <= 0 && red.health > 0 && blue.health > 0) return 'red';

    // Check for health depletion (KO)
    if (blue.health <= 0 && red.mana > 0 && blue.mana > 0) return 'red';
    if (red.health <= 0 && blue.mana > 0 && red.mana > 0) return 'blue';

    // Compare remaining health
    if (red.health > blue.health) return 'red';
    if (blue.health > red.health) return 'blue';

    // Compare fouls
    if (red.fouls < blue.fouls) return 'red';
    if (blue.fouls < red.fouls) return 'blue';

    // Compare technique points
    if (red.technique > blue.technique) return 'red';
    if (blue.technique > red.technique) return 'blue';

    // Compare head hits
    if (red.headHits > blue.headHits) return 'red';
    if (blue.headHits > red.headHits) return 'blue';

    return 'tie';
  },

  resetMatch: () => {
    set({
      currentRound: 1,
      maxRounds: BO3_MAX_ROUNDS,
      roundWinners: [],
      redWon: 0,
      blueWon: 0,
      matchWinner: null,
      isMatchOver: false,
    });
  },

  resetRound: () => {
    // Round state is managed through currentRound, nothing else to reset here
  },

  setMatchOver: (winner) => {
    set({
      matchWinner: winner,
      isMatchOver: true,
    });
  },

  closeMatchResult: () => {
    set({
      matchWinner: null,
      isMatchOver: false,
    });
  },

  setMaxRounds: (rounds) => {
    set({ maxRounds: rounds });
  },

  hydrateFromServerScores: ({ redWins, blueWins }) => {
    const isOver = redWins >= BO3_WINS_NEEDED || blueWins >= BO3_WINS_NEEDED;
    const matchWinner: Player | null = isOver
      ? redWins >= BO3_WINS_NEEDED
        ? 'red'
        : 'blue'
      : null;
    const placeholders: Array<Player | null> = [null, null, null];
    set((state) => ({
      maxRounds: BO3_MAX_ROUNDS,
      redWon: redWins,
      blueWon: blueWins,
      currentRound: deriveArenaCurrentRound(redWins, blueWins),
      roundWinners: placeholders,
      isMatchOver: isOver,
      matchWinner,
      hydrationGeneration: state.hydrationGeneration + 1,
    }));
  },
}));
