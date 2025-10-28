import { DifficultyLevel } from '@core/engine';

export interface PairCard {
  id: string;
  glyph: string;
  audio: string;
  pairId: string;
  revealed: boolean;
  matched: boolean;
  category: 'animals' | 'fruits' | 'hiragana' | 'numbers';
}

export interface PairMatchConfig {
  columns: number;
  rows: number;
  maxMistakes: number;
  revealMs: number;
  categories: Partial<Record<PairCard['category'], number>>;
}

export type PairMatchDifficultyMap = Record<DifficultyLevel, PairMatchConfig>;
