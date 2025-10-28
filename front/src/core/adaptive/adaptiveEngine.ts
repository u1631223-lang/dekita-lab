import { AdaptiveRecommendation, DifficultyLevel, GameId, RoundContext, RoundResult } from '@core/engine';
import { AdaptiveConfig, AdaptiveEngine, AdaptiveSnapshot } from './types';
import { ControlledRandomizer } from './randomSeedManager';

const DIFFICULTY_ORDER: DifficultyLevel[] = ['lv1', 'lv2', 'lv3', 'lv4'];

const clampDifficulty = (value: DifficultyLevel) => {
  if (!DIFFICULTY_ORDER.includes(value)) {
    return 'lv1';
  }
  return value;
};

const getNextDifficulty = (current: DifficultyLevel, delta: number) => {
  const index = DIFFICULTY_ORDER.indexOf(current);
  const next = DIFFICULTY_ORDER[index + delta];
  return clampDifficulty(next ?? current);
};

const roundHistoryLimit = 10;

interface GameAdaptiveState {
  difficulty: DifficultyLevel;
  streak: number;
  consecutiveFails: number;
  history: RoundResult[];
}

export const createAdaptiveEngine = (
  config: AdaptiveConfig,
  randomizer = new ControlledRandomizer({ seed: 'dekita-lab' })
): AdaptiveEngine => {
  const stateByGame = new Map<GameId, GameAdaptiveState>();

  const ensureState = (gameId: GameId): GameAdaptiveState => {
    if (!stateByGame.has(gameId)) {
      stateByGame.set(gameId, {
        difficulty: config.baseDifficulty[gameId],
        streak: 0,
        consecutiveFails: 0,
        history: []
      });
    }
    return stateByGame.get(gameId)!;
  };

  const toSnapshot = (): AdaptiveSnapshot => {
    const difficultyByGame = {} as AdaptiveSnapshot['difficultyByGame'];
    stateByGame.forEach((value, key) => {
      difficultyByGame[key] = value.difficulty;
    });

    const aggregateHistory = Array.from(stateByGame.values()).flatMap((state) => state.history);
    const successes = aggregateHistory.filter((item) => item.success).length;
    const successRate = aggregateHistory.length > 0 ? successes / aggregateHistory.length : 0;

    return {
      streak: Math.max(...Array.from(stateByGame.values()).map((state) => state.streak), 0),
      successRate,
      recentRounds: aggregateHistory.length,
      difficultyByGame
    };
  };

  const assess = (context: RoundContext, result: RoundResult): AdaptiveRecommendation => {
    const state = ensureState(context.gameId);
    const history = state.history;

    history.push(result);
    if (history.length > roundHistoryLimit) {
      history.shift();
    }

    let nextDifficulty = state.difficulty;
    let rewardTier: AdaptiveRecommendation['rewardTier'] = 'base';

    if (result.success) {
      state.streak += 1;
      state.consecutiveFails = 0;
      const successRate = history.filter((item) => item.success).length / history.length;

      if (successRate > config.successUpper) {
        nextDifficulty = getNextDifficulty(state.difficulty, +1);
      }

      const thresholds = [...config.streakThresholds].sort((a, b) => a - b);
      if (thresholds.some((threshold) => state.streak === threshold)) {
        rewardTier = state.streak >= thresholds[thresholds.length - 1] ? 'super' : 'streak';
      }
    } else {
      state.consecutiveFails += 1;
      state.streak = 0;
      if (state.consecutiveFails >= 2) {
        nextDifficulty = getNextDifficulty(state.difficulty, -1);
      }
    }

    const provideHint = state.consecutiveFails >= 3;

    // Never increase difficulty if the latest round was a failure.
    if (!result.success && nextDifficulty !== state.difficulty) {
      nextDifficulty = getNextDifficulty(state.difficulty, -1);
    }

    state.difficulty = nextDifficulty;

    randomizer.recordOutcome({
      gameId: context.gameId,
      roundId: context.roundId,
      success: result.success
    });

    return {
      nextDifficulty,
      provideHint,
      rewardTier
    };
  };

  return {
    assess,
    getState: toSnapshot
  };
};
