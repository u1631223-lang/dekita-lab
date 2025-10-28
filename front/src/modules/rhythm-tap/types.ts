import { DifficultyLevel } from '@core/engine';

export type RhythmStimulusCategory = 'basic' | 'numbers' | 'hiragana' | 'shapes';

export interface RhythmStimulus {
  id: string;
  glyph: string;
  audio: string;
  category: RhythmStimulusCategory;
}

export interface RhythmDifficultyConfig {
  patternLength: [number, number];
  tempoMs: number;
  playbackDelayMs: number;
  categories: Partial<Record<RhythmStimulusCategory, number>>;
}

export type RhythmDifficultyMap = Record<DifficultyLevel, RhythmDifficultyConfig>;

export interface RhythmGameState {
  pattern: RhythmStimulus[];
  input: RhythmStimulus[];
  isPlayingBack: boolean;
  mistakes: number;
  hintActive: boolean;
}
