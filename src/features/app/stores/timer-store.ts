import { create } from 'zustand';

interface TimerState {
  timeLeft: number;
  breakTimeLeft: number;
  isRunning: boolean;
  isBreakTime: boolean;
  roundStarted: boolean;
  roundEnded: boolean;
  roundDuration: number;
  breakDuration: number;
}

interface TimerActions {
  start: () => void;
  pause: () => void;
  toggle: () => void;
  tick: (deltaMs: number) => void;
  startBreak: () => void;
  toggleBreak: () => void;
  skipBreak: () => void;
  tickBreak: (deltaMs: number) => void;
  setRoundEnded: (ended: boolean) => void;
  reset: () => void;
  primeRound: (roundDurationMs: number) => void;
  setRoundDuration: (duration: number) => void;
  setBreakDuration: (duration: number) => void;
}

type TimerStore = TimerState & TimerActions;

const DEFAULT_ROUND_DURATION = 60 * 1000; // 60 seconds
const DEFAULT_BREAK_DURATION = 30 * 1000; // 30 seconds

export const useTimerStore = create<TimerStore>()((set, get) => ({
  timeLeft: DEFAULT_ROUND_DURATION,
  breakTimeLeft: DEFAULT_BREAK_DURATION,
  isRunning: false,
  isBreakTime: false,
  roundStarted: false,
  roundEnded: false,
  roundDuration: DEFAULT_ROUND_DURATION,
  breakDuration: DEFAULT_BREAK_DURATION,

  start: () => {
    const state = get();
    if (state.isBreakTime || state.roundEnded) return;

    set({
      isRunning: true,
      roundStarted: true,
    });
  },

  pause: () => {
    set({ isRunning: false });
  },

  toggle: () => {
    const state = get();
    if (state.isBreakTime || state.roundEnded) return;

    if (state.isRunning) {
      set({ isRunning: false });
    } else {
      set({
        isRunning: true,
        roundStarted: true,
      });
    }
  },

  tick: (deltaMs) => {
    const state = get();
    if (!state.isRunning || state.isBreakTime) return;

    const newTimeLeft = Math.max(0, state.timeLeft - deltaMs);

    if (newTimeLeft <= 0) {
      set({
        timeLeft: 0,
        isRunning: false,
        roundEnded: true,
      });
    } else {
      set({ timeLeft: newTimeLeft });
    }
  },

  startBreak: () => {
    const state = get();
    set({
      isBreakTime: true,
      isRunning: true,
      breakTimeLeft: state.breakDuration,
      roundEnded: false,
    });
  },

  toggleBreak: () => {
    const state = get();
    if (!state.isBreakTime) return;

    set({
      isRunning: !state.isRunning,
    });
  },

  skipBreak: () => {
    const state = get();
    if (!state.isBreakTime) return;

    set({
      breakTimeLeft: 0,
      isBreakTime: false,
      isRunning: false,
    });
  },

  setRoundEnded: (ended) => {
    set({ roundEnded: ended, isRunning: false });
  },

  tickBreak: (deltaMs) => {
    const state = get();
    if (!state.isBreakTime || !state.isRunning) return;

    const newBreakTimeLeft = Math.max(0, state.breakTimeLeft - deltaMs);

    if (newBreakTimeLeft <= 0) {
      set({
        breakTimeLeft: 0,
        isBreakTime: false,
        isRunning: false,
      });
    } else {
      set({ breakTimeLeft: newBreakTimeLeft });
    }
  },

  reset: () => {
    const state = get();
    set({
      timeLeft: state.roundDuration,
      breakTimeLeft: state.breakDuration,
      isRunning: false,
      isBreakTime: false,
      roundStarted: false,
      roundEnded: false,
    });
  },

  primeRound: (roundDuration) => {
    set({
      timeLeft: roundDuration,
      isRunning: false,
      isBreakTime: false,
      roundStarted: false,
      roundEnded: false,
    });
  },

  setRoundDuration: (duration) => {
    set({
      roundDuration: duration,
      timeLeft: duration,
    });
  },

  setBreakDuration: (duration) => {
    set({
      breakDuration: duration,
      breakTimeLeft: duration,
    });
  },
}));
