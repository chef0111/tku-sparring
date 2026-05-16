import { create } from 'zustand';
import { temporal } from 'zundo';
import type { StateCreator } from 'zustand';
import type { HitType } from '@/lib/scoreboard/hit-types';
import { hitCooldown, hitDamage } from '@/lib/scoreboard/hit-types';

export interface PlayerData {
  name: string;
  avatar: string | null;
  score: number;
  health: number;
  hits: number;
  fouls: number;
  mana: number;
  technique: number;
  headHits: number;
  roundScores: Array<number>;
}

interface HitInfo {
  hitType: HitType;
  timestamp: number;
}

interface PlayerState {
  red: PlayerData;
  blue: PlayerData;

  maxHealth: number;
  maxMana: number;

  lastRedHit: HitInfo | null;
  lastBlueHit: HitInfo | null;

  // Cooldown tracking
  lastHitTimes: Record<Player, number>;
}

interface PlayerActions {
  recordHit: (
    player: Player,
    hitType: HitType,
    canScore: boolean,
    isBreakTime: boolean
  ) => boolean; // Returns true if KO occurred

  addPenalty: (player: Player) => boolean; // Returns true if disqualified
  removePenalty: (player: Player) => void;

  resetScores: () => void;
  resetHealth: () => void;
  resetRoundStats: () => void;
  resetRoundCombatPreserveHealth: () => void;
  resetMatchCombatPreservePlayers: () => void;
  resetAll: () => void;

  saveRoundScores: (roundIndex: number) => void;
  setMaxHealth: (health: number) => void;
  setMaxMana: (mana: number) => void;
  setPlayerName: (player: Player, name: string) => void;
  setPlayerAvatar: (player: Player, avatar: string | null) => void;
}

export type PlayerStore = PlayerState & PlayerActions;

const createInitialPlayerData = (
  name: string,
  maxHealth = 120,
  maxMana = 5
): PlayerData => ({
  name,
  avatar: null,
  score: 0,
  health: maxHealth,
  hits: 0,
  fouls: 0,
  mana: maxMana,
  technique: 0,
  headHits: 0,
  roundScores: [0, 0, 0],
});

const initializer: StateCreator<PlayerStore> = (set, get) => ({
  red: createInitialPlayerData('Player A'),
  blue: createInitialPlayerData('Player B'),
  maxHealth: 120,
  maxMana: 5,
  lastRedHit: null,
  lastBlueHit: null,
  lastHitTimes: { red: 0, blue: 0 },

  recordHit: (player, hitType, canScore, isBreakTime) => {
    const state = get();
    const currentTime = Date.now();

    // Prevent rapid hits (cooldown)
    if (currentTime - state.lastHitTimes[player] < hitCooldown) {
      return false;
    }

    if (isBreakTime || !canScore) {
      return false;
    }

    const opponent: Player = player === 'red' ? 'blue' : 'red';
    const damage = hitDamage[hitType];

    const opponentHealth = Math.max(0, state[opponent].health - damage);
    const playerScore = Math.min(state.maxHealth, state[player].score + damage);

    const technique =
      damage >= 20 ? state[player].technique + damage : state[player].technique;

    const headHits =
      damage === 15 ? state[player].headHits + 1 : state[player].headHits;

    const hitUpdate =
      player === 'red'
        ? { lastRedHit: { hitType, timestamp: currentTime } }
        : { lastBlueHit: { hitType, timestamp: currentTime } };

    set({
      [opponent]: {
        ...state[opponent],
        health: opponentHealth,
      },
      [player]: {
        ...state[player],
        score: playerScore,
        hits: state[player].hits + 1,
        technique,
        headHits,
      },
      ...hitUpdate,
      lastHitTimes: {
        ...state.lastHitTimes,
        [player]: currentTime,
      },
    });

    return opponentHealth <= 0;
  },

  addPenalty: (player) => {
    const state = get();
    const newMana = Math.max(0, state[player].mana - 1);
    const newFouls = state[player].fouls + 1;

    set({
      [player]: {
        ...state[player],
        mana: newMana,
        fouls: newFouls,
      },
    });

    return newMana <= 0;
  },

  removePenalty: (player) => {
    const state = get();
    if (state[player].fouls <= 0) return;

    set({
      [player]: {
        ...state[player],
        mana: Math.min(state.maxMana, state[player].mana + 1),
        fouls: state[player].fouls - 1,
      },
    });
  },

  resetScores: () => {
    const state = get();
    set({
      red: { ...state.red, score: 0 },
      blue: { ...state.blue, score: 0 },
    });
  },

  resetHealth: () => {
    const state = get();
    set({
      red: { ...state.red, health: state.maxHealth },
      blue: { ...state.blue, health: state.maxHealth },
    });
  },

  resetRoundStats: () => {
    const state = get();
    set({
      red: {
        ...state.red,
        score: 0,
        health: state.maxHealth,
        hits: 0,
        fouls: 0,
        mana: state.maxMana,
        technique: 0,
        headHits: 0,
      },
      blue: {
        ...state.blue,
        score: 0,
        health: state.maxHealth,
        hits: 0,
        fouls: 0,
        mana: state.maxMana,
        technique: 0,
        headHits: 0,
      },
      lastRedHit: null,
      lastBlueHit: null,
      lastHitTimes: { red: 0, blue: 0 },
    });
  },

  resetRoundCombatPreserveHealth: () => {
    const state = get();
    set({
      red: {
        ...state.red,
        score: 0,
        hits: 0,
        fouls: 0,
        mana: state.maxMana,
        technique: 0,
        headHits: 0,
      },
      blue: {
        ...state.blue,
        score: 0,
        hits: 0,
        fouls: 0,
        mana: state.maxMana,
        technique: 0,
        headHits: 0,
      },
      lastRedHit: null,
      lastBlueHit: null,
      lastHitTimes: { red: 0, blue: 0 },
    });
  },

  resetMatchCombatPreservePlayers: () => {
    const state = get();
    set({
      red: {
        ...state.red,
        score: 0,
        hits: 0,
        fouls: 0,
        mana: state.maxMana,
        technique: 0,
        headHits: 0,
        roundScores: state.red.roundScores.map(() => 0),
      },
      blue: {
        ...state.blue,
        score: 0,
        hits: 0,
        fouls: 0,
        mana: state.maxMana,
        technique: 0,
        headHits: 0,
        roundScores: state.blue.roundScores.map(() => 0),
      },
      lastRedHit: null,
      lastBlueHit: null,
      lastHitTimes: { red: 0, blue: 0 },
    });
  },

  resetAll: () => {
    const state = get();
    set({
      red: {
        ...createInitialPlayerData(
          state.red.name,
          state.maxHealth,
          state.maxMana
        ),
        name: state.red.name,
        avatar: state.red.avatar,
      },
      blue: {
        ...createInitialPlayerData(
          state.blue.name,
          state.maxHealth,
          state.maxMana
        ),
        name: state.blue.name,
        avatar: state.blue.avatar,
      },
      lastRedHit: null,
      lastBlueHit: null,
      lastHitTimes: { red: 0, blue: 0 },
    });
  },

  saveRoundScores: (roundIndex) => {
    const state = get();
    const redRoundScores = [...state.red.roundScores];
    const blueRoundScores = [...state.blue.roundScores];
    redRoundScores[roundIndex] = state.red.score;
    blueRoundScores[roundIndex] = state.blue.score;

    set({
      red: { ...state.red, roundScores: redRoundScores },
      blue: { ...state.blue, roundScores: blueRoundScores },
    });
  },

  setMaxHealth: (health) => {
    const state = get();
    set({
      maxHealth: health,
      red: { ...state.red, health },
      blue: { ...state.blue, health },
    });
  },

  setMaxMana: (mana) => {
    set({ maxMana: mana });
  },

  setPlayerName: (player, name) => {
    const state = get();
    set({
      [player]: { ...state[player], name },
    });
  },

  setPlayerAvatar: (player, avatar) => {
    const state = get();
    set({
      [player]: { ...state[player], avatar },
    });
  },
});

export const usePlayerStore = create<PlayerStore>()(
  temporal(initializer, {
    limit: 50,
    partialize: (state) => {
      const { red, blue, lastRedHit, lastBlueHit, lastHitTimes } = state;
      return { red, blue, lastRedHit, lastBlueHit, lastHitTimes };
    },
  })
);
