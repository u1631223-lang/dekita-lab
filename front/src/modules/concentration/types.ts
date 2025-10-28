import { DifficultyLevel } from '@core/engine';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardColor = 'red' | 'black';

export type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K';

export type ConcentrationCard = {
  id: string;
  pairId: string;
  rank: Rank;
  suit: Suit;
  color: CardColor;
  revealed: boolean;
  matched: boolean;
};

export type MatchRule = 'rank';

export type ConcentrationConfig = {
  rows: number;
  columns: number;
  hideDelayMs: number;
  rankPool: Rank[];
  suitPool: Suit[];
  matchRule: MatchRule;
};

export type ConcentrationDifficultyMap = Record<DifficultyLevel, ConcentrationConfig>;
