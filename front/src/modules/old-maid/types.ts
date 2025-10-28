import { DifficultyLevel } from '@core/engine';

export type OldMaidSuit = '♠' | '♥' | '♦' | '♣' | 'JOKER';

export type OldMaidRank =
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
  | 'K'
  | 'JOKER';

export interface OldMaidCard {
  id: string;
  suit: OldMaidSuit;
  rank: OldMaidRank;
  isJoker: boolean;
}

export type OldMaidPlayerStatus = 'playing' | 'finished';

export interface OldMaidPlayerState {
  id: string;
  displayNameKey: string;
  isHuman: boolean;
  hand: OldMaidCard[];
  status: OldMaidPlayerStatus;
}

export interface OldMaidPairRemoval {
  rank: OldMaidRank;
  cards: [OldMaidCard, OldMaidCard];
}

export interface OldMaidConfig {
  aiPlayers: number;
  maxHints: number;
  aiDelayMs: number;
  jokerAvoidance: number;
  revealHintMs: number;
}

export interface OldMaidRoundState {
  players: OldMaidPlayerState[];
  turnIndex: number;
  jokerHolderId: string | null;
  discardedPairs: number;
  config: OldMaidConfig;
}

export type OldMaidDifficultyMap = Partial<Record<DifficultyLevel, OldMaidConfig>>;
