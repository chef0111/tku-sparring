import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  afterFinish,
  prepArena,
  redoRound,
  replayMatch,
} from '../arena-scoring-actions';
import { useMatchStore } from '../match-store';
import { usePlayerStore } from '../player-store';
import { useTimerStore } from '../timer-store';

const ROUND_MS = 60_000;

function resetStoresToBaseline() {
  usePlayerStore.getState().resetAll();
  useMatchStore.getState().resetMatch();
  useTimerStore.getState().reset();
}

describe('arena-scoring-actions', () => {
  beforeEach(() => {
    resetStoresToBaseline();
  });

  afterEach(() => {
    resetStoresToBaseline();
  });

  it('replayMatch resets match progress and soft-resets players', () => {
    useMatchStore.setState({
      currentRound: 2,
      redWon: 1,
      blueWon: 0,
      roundWinners: ['red', null],
    });
    usePlayerStore.setState({
      red: {
        ...usePlayerStore.getState().red,
        score: 7,
        health: 80,
        roundScores: [3, 4, 0],
      },
    });

    replayMatch();

    const match = useMatchStore.getState();
    expect(match.currentRound).toBe(1);
    expect(match.redWon).toBe(0);
    expect(match.blueWon).toBe(0);
    expect(match.roundWinners).toEqual([]);

    const red = usePlayerStore.getState().red;
    expect(red.score).toBe(0);
    expect(red.roundScores).toEqual([0, 0, 0]);
    expect(red.health).toBe(80);
  });

  it('afterFinish resets players fully (health to max)', () => {
    usePlayerStore.setState({
      red: {
        ...usePlayerStore.getState().red,
        score: 10,
        health: 40,
        name: 'Keep Name',
      },
    });

    afterFinish();

    const red = usePlayerStore.getState().red;
    expect(red.health).toBe(usePlayerStore.getState().maxHealth);
    expect(red.score).toBe(0);
    expect(red.name).toBe('Keep Name');
  });

  it('redoRound resets timer and in-round player stats when not on break', () => {
    useTimerStore.setState({
      timeLeft: 5_000,
      isBreakTime: false,
      roundStarted: true,
      roundEnded: true,
    });
    usePlayerStore.setState({
      red: {
        ...usePlayerStore.getState().red,
        score: 12,
        hits: 3,
      },
    });

    redoRound();

    const timer = useTimerStore.getState();
    expect(timer.timeLeft).toBe(timer.roundDuration);
    expect(timer.roundEnded).toBe(false);
    expect(usePlayerStore.getState().red.score).toBe(0);
    expect(usePlayerStore.getState().red.hits).toBe(0);
  });

  it('redoRound is a no-op during break (player round stats unchanged)', () => {
    useTimerStore.setState({
      isBreakTime: true,
      timeLeft: 1_000,
    });
    usePlayerStore.setState({
      red: {
        ...usePlayerStore.getState().red,
        score: 99,
        hits: 5,
      },
    });

    redoRound();

    expect(usePlayerStore.getState().red.score).toBe(99);
    expect(usePlayerStore.getState().red.hits).toBe(5);
  });

  it('prepArena primes timer and resets match + players', () => {
    useTimerStore.setState({ timeLeft: 1_000 });
    useMatchStore.setState({ currentRound: 3, redWon: 2 });
    usePlayerStore.setState({
      red: {
        ...usePlayerStore.getState().red,
        score: 5,
        health: 50,
      },
    });

    prepArena(ROUND_MS);

    expect(useTimerStore.getState().timeLeft).toBe(ROUND_MS);
    expect(useMatchStore.getState().currentRound).toBe(1);
    expect(usePlayerStore.getState().red.health).toBe(
      usePlayerStore.getState().maxHealth
    );
    expect(usePlayerStore.getState().red.score).toBe(0);
  });
});
