import { ControlledRandomizer } from '@core/adaptive';
import { DifficultyLevel } from '@core/engine';
import { SequenceSparkConfig, SequenceSparkDifficultyMap, SequenceSparkRoundState, SparkPad, SparkPadId } from './types';

const PADS: SparkPad[] = [
  { id: 'sun', label: '☀️', gradient: 'linear-gradient(135deg, #ffb347 0%, #ffcc33 100%)' },
  { id: 'moon', label: '🌙', gradient: 'linear-gradient(135deg, #7f7ae8 0%, #b69df2 100%)' },
  { id: 'leaf', label: '🍃', gradient: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)' },
  { id: 'wave', label: '🌊', gradient: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)' }
];

export const SEQUENCE_SPARK_DIFFICULTY: SequenceSparkDifficultyMap = {
  lv1: {
    sequenceLength: [2, 3],
    playbackIntervalMs: 900,
    flashDurationMs: 500
  },
  lv2: {
    sequenceLength: [3, 4],
    playbackIntervalMs: 750,
    flashDurationMs: 420
  },
  lv3: {
    sequenceLength: [4, 5],
    playbackIntervalMs: 600,
    flashDurationMs: 360
  },
  lv4: {
    sequenceLength: [5, 6],
    playbackIntervalMs: 520,
    flashDurationMs: 300
  }
};

export const generateSequence = (
  difficulty: DifficultyLevel,
  randomizer: ControlledRandomizer
): SequenceSparkRoundState => {
  const config: SequenceSparkConfig = SEQUENCE_SPARK_DIFFICULTY[difficulty] ?? SEQUENCE_SPARK_DIFFICULTY.lv1;
  const [minLength, maxLength] = config.sequenceLength;
  const length = minLength + Math.floor(randomizer.nextFloat() * Math.max(1, maxLength - minLength + 1));
  const sequence: SparkPadId[] = [];
  for (let i = 0; i < length; i += 1) {
    const padIndex = Math.floor(randomizer.nextFloat() * PADS.length);
    sequence.push(PADS[padIndex].id);
  }
  return {
    pads: PADS,
    sequence,
    config
  };
};
