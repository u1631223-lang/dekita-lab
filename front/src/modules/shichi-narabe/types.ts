import { DifficultyLevel } from '@core/engine';

export type ShichiNarabeSuit = 'spade' | 'heart' | 'diamond' | 'club';

export type ShichiNarabeRank =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13;

export interface ShichiNarabeCard {
  id: string;
  suit: ShichiNarabeSuit;
  rank: ShichiNarabeRank;
  label: string;
}

export interface ShichiNarabeFieldLane {
  lowest: ShichiNarabeRank;
  highest: ShichiNarabeRank;
  cards: ShichiNarabeCard[];
}

export interface ShichiNarabeOpponentState {
  id: string;
  displayNameKey: string;
  cards: ShichiNarabeCard[];
  passesUsed: number;
}

export interface ShichiNarabeRoundConfig {
  passLimit: number;
  opponentCount: number;
  hintDelayMs: number;
  autoHintOnStall: boolean;
}

export interface ShichiNarabeRoundState {
  field: Record<ShichiNarabeSuit, ShichiNarabeFieldLane>;
  playerHand: ShichiNarabeCard[];
  opponents: ShichiNarabeOpponentState[];
  config: ShichiNarabeRoundConfig;
}

export type ShichiNarabeDifficultyMap = Record<DifficultyLevel, ShichiNarabeRoundConfig>;

export const SHICHI_NARABE_SUITS: ShichiNarabeSuit[] = ['spade', 'heart', 'diamond', 'club'];

export const SHICHI_NARABE_SUIT_SYMBOL: Record<ShichiNarabeSuit, string> = {
  spade: '♠',
  heart: '♥',
  diamond: '♦',
  club: '♣'
};
