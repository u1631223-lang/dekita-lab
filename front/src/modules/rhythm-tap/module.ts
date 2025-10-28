import { ControlledRandomizer } from '@core/adaptive';
import { GameModule, RoundResult, DifficultyLevel } from '@core/engine';
import { generatePattern, RHYTHM_DIFFICULTY, RHYTHM_LIBRARY } from './config';
import { RhythmDifficultyConfig, RhythmStimulus } from './types';

export type RhythmRoundState = {
  pattern: RhythmStimulus[];
  config: RhythmDifficultyConfig;
  stimuliPool: RhythmStimulus[];
};

const buildStimuliPool = (config: RhythmDifficultyConfig) => {
  const categories = Object.keys(config.categories ?? {});
  if (categories.length === 0) {
    return RHYTHM_LIBRARY.slice(0, 4);
  }
  return RHYTHM_LIBRARY.filter((stimulus) => categories.includes(stimulus.category));
};

export const createRhythmTapModule = (): GameModule<RhythmRoundState, RoundResult> => ({
  id: 'rhythm',
  titleKey: 'hub.rhythm',
  icon: '🎵',
  baseDifficulty: 'lv1',
  createRound: ({ difficulty, randomizer }: { difficulty: DifficultyLevel; randomizer: ControlledRandomizer }) => {
    const config = RHYTHM_DIFFICULTY[difficulty] ?? RHYTHM_DIFFICULTY.lv1;
    return {
      pattern: generatePattern(difficulty, randomizer),
      config,
      stimuliPool: buildStimuliPool(config)
    };
  },
  evaluate: ({ input }) => input
});
