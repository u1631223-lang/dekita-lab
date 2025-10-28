import { DifficultyLevel } from '@core/engine';

export type SparkPadId = 'sun' | 'moon' | 'leaf' | 'wave';

export interface SparkPad {
  id: SparkPadId;
  label: string;
  gradient: string;
}

export interface SequenceSparkConfig {
  sequenceLength: [number, number];
  playbackIntervalMs: number;
  flashDurationMs: number;
}

export type SequenceSparkDifficultyMap = Record<DifficultyLevel, SequenceSparkConfig>;

export interface SequenceSparkRoundState {
  pads: SparkPad[];
  sequence: SparkPadId[];
  config: SequenceSparkConfig;
}
