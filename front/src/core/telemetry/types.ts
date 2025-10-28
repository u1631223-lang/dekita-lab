import { DifficultyLevel, GameId } from '@core/engine';

export interface RoundTelemetryEntry {
  gameId: GameId;
  success: boolean;
  reactionTimeMs: number;
  difficulty: DifficultyLevel;
  timestamp: number;
  hintsUsed: number;
}

export interface SessionSummary {
  successRate: number;
  averageReactionTime: number;
  bestStreak: number;
  totalRounds: number;
  reactionTrendMs: number;
  lastUpdated: number;
}

export interface TelemetryStore {
  record(entry: RoundTelemetryEntry): void;
  recent(limit?: number): RoundTelemetryEntry[];
  summary(): SessionSummary;
  summaryForGame(gameId: GameId, limit?: number): SessionSummary;
  reset(): void;
}
