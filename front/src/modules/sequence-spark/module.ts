import { ControlledRandomizer } from '@core/adaptive';
import { GameModule, RoundResult, DifficultyLevel } from '@core/engine';
import { generateSequence } from './config';
import { SequenceSparkRoundState } from './types';

export const createSequenceSparkModule = (): GameModule<SequenceSparkRoundState, RoundResult> => ({
  id: 'sequence-spark',
  titleKey: 'hub.sequence',
  icon: '✨',
  baseDifficulty: 'lv1',
  createRound: ({ difficulty, randomizer }: { difficulty: DifficultyLevel; randomizer: ControlledRandomizer }) =>
    generateSequence(difficulty, randomizer),
  evaluate: ({ input }) => input
});
