import { createStore } from 'zustand/vanilla';
import { DifficultyLevel, GameId } from '@core/engine';
import { RoundTelemetryEntry, SessionSummary, TelemetryStore } from './types';
import { persist } from 'zustand/middleware';

interface TelemetryState {
  entries: RoundTelemetryEntry[];
}

const MAX_ENTRIES = 120;

const computeSummary = (entries: RoundTelemetryEntry[]): SessionSummary => {
  if (entries.length === 0) {
    return {
      successRate: 0,
      averageReactionTime: 0,
      bestStreak: 0,
      totalRounds: 0,
       reactionTrendMs: 0,
      lastUpdated: Date.now()
    };
  }

  const successes = entries.filter((entry) => entry.success).length;
  let longest = 0;
  let current = 0;
  entries.forEach((entry) => {
    if (entry.success) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  });

  const averageReactionTime =
    entries.reduce((sum, entry) => sum + entry.reactionTimeMs, 0) / entries.length;

  const alpha = 0.3;
  let trend = entries[0].reactionTimeMs;
  entries.forEach((entry, index) => {
    if (index === 0) {
      trend = entry.reactionTimeMs;
    } else {
      trend = alpha * entry.reactionTimeMs + (1 - alpha) * trend;
    }
  });

  return {
    successRate: successes / entries.length,
    averageReactionTime,
    bestStreak: longest,
    totalRounds: entries.length,
    reactionTrendMs: trend,
    lastUpdated: Date.now()
  };
};

const sanitizeDifficulty = (difficulty: DifficultyLevel): DifficultyLevel => {
  const allowed: DifficultyLevel[] = ['lv1', 'lv2', 'lv3', 'lv4'];
  return allowed.includes(difficulty) ? difficulty : 'lv1';
};

export const createTelemetryStore = (): TelemetryStore => {
  const baseStore = createStore<TelemetryState>()(
    persist(
      () => ({ entries: [] }),
      {
        name: 'dekita-telemetry',
        partialize: (state) => ({ entries: state.entries.slice(-MAX_ENTRIES) })
      }
    )
  );

  const record = (entry: RoundTelemetryEntry) => {
    baseStore.setState((state) => {
      const sanitizedEntry: RoundTelemetryEntry = {
        ...entry,
        difficulty: sanitizeDifficulty(entry.difficulty)
      };

      const updated = [...state.entries, sanitizedEntry].slice(-MAX_ENTRIES);
      return { entries: updated };
    });
  };

  const recent = (limit = 10) => baseStore.getState().entries.slice(-limit).reverse();

  const summary = () => computeSummary(baseStore.getState().entries);

  const summaryForGame = (gameId: GameId, limit = 30) => {
    const entries = baseStore.getState().entries.filter((entry) => entry.gameId === gameId).slice(-limit);
    return computeSummary(entries);
  };

  const reset = () => baseStore.setState({ entries: [] });

  return {
    record,
    recent,
    summary,
    summaryForGame,
    reset
  };
};
