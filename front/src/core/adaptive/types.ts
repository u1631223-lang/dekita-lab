import { AdaptiveRecommendation, DifficultyLevel, GameId, RoundContext, RoundResult } from '@core/engine';

export interface AdaptiveConfig {
  baseDifficulty: Record<GameId, DifficultyLevel>;
  successUpper: number;
  successLower: number;
  streakThresholds: number[];
}

export interface AdaptiveEngine {
  assess(context: RoundContext, result: RoundResult): AdaptiveRecommendation;
  getState(): AdaptiveSnapshot;
}

export interface AdaptiveSnapshot {
  streak: number;
  successRate: number;
  recentRounds: number;
  difficultyByGame: Record<GameId, DifficultyLevel>;
}
