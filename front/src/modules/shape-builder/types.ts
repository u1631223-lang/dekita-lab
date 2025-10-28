import { DifficultyLevel } from '@core/engine';

export type ShapeTokenId = 'triangle' | 'square' | 'circle' | 'star' | 'hex';

export interface ShapeToken {
  id: ShapeTokenId;
  label: string;
  gradient: string;
}

export interface ShapeBuilderConfig {
  columns: number;
  rows: number;
  palette: ShapeTokenId[];
  autoReveal: boolean;
}

export type ShapeBuilderDifficultyMap = Record<DifficultyLevel, ShapeBuilderConfig>;

export interface ShapeCell {
  id: string;
  target: ShapeTokenId;
  placed?: ShapeTokenId;
}

export interface ShapeBuilderRoundState {
  config: ShapeBuilderConfig;
  cells: ShapeCell[];
  available: ShapeToken[];
}
