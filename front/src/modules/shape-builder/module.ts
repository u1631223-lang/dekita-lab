import { ControlledRandomizer } from '@core/adaptive';
import { GameModule, RoundResult, DifficultyLevel } from '@core/engine';
import { buildRoundState } from './config';
import { ShapeBuilderRoundState } from './types';

export const createShapeBuilderModule = (): GameModule<ShapeBuilderRoundState, RoundResult> => ({
  id: 'shape-builder',
  titleKey: 'hub.shape',
  icon: '🧩',
  baseDifficulty: 'lv1',
  createRound: ({ difficulty, randomizer }: { difficulty: DifficultyLevel; randomizer: ControlledRandomizer }) =>
    buildRoundState(difficulty, randomizer),
  evaluate: ({ input }) => input
});
