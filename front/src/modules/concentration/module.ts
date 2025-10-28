import { ControlledRandomizer } from '@core/adaptive';
import { DifficultyLevel, GameModule, RoundResult } from '@core/engine';
import { createDeck } from './config';
import { ConcentrationCard, ConcentrationConfig } from './types';

export type ConcentrationRoundState = {
  deck: ConcentrationCard[];
  config: ConcentrationConfig;
};

export const createConcentrationModule = (): GameModule<ConcentrationRoundState, RoundResult> => ({
  id: 'concentration',
  titleKey: 'hub.concentration',
  icon: '🂡',
  baseDifficulty: 'lv1',
  createRound: ({ difficulty, randomizer }: { difficulty: DifficultyLevel; randomizer: ControlledRandomizer }) => {
    const { deck, config } = createDeck(difficulty, randomizer);
    return { deck, config };
  },
  evaluate: ({ input }) => input
});
