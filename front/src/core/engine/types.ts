export type GameId = 'rhythm' | 'pair-match' | 'sequence-spark' | 'shape-builder' | 'card-sprint';

export type DifficultyLevel = 'lv1' | 'lv2' | 'lv3' | 'lv4' | 'lv5' | 'lv6';

export type SessionStage = 'hub' | 'game' | 'summary';

export interface RoundContext {
  gameId: GameId;
  difficulty: DifficultyLevel;
  roundId: string;
  startedAt: number;
}

export interface RoundResult {
  success: boolean;
  reactionTimeMs: number;
  hintsUsed: number;
  endedAt: number;
}

export interface AdaptiveRecommendation {
  nextDifficulty: DifficultyLevel;
  provideHint: boolean;
  rewardTier: 'base' | 'streak' | 'super';
}

export type SessionEvent =
  | { type: 'stage-changed'; stage: SessionStage }
  | { type: 'round-started'; context: RoundContext }
  | { type: 'round-finished'; context: RoundContext; result: RoundResult; recommendation: AdaptiveRecommendation };

export type SessionEventListener = (event: SessionEvent) => void;
