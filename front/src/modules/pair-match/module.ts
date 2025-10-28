import { ControlledRandomizer } from '@core/adaptive';
import { GameModule, RoundResult, DifficultyLevel } from '@core/engine';
import { createDeck } from './config';
import { PairMatchConfig, PairCard } from './types';

export type PairMatchRoundState = {
  deck: PairCard[];
  config: PairMatchConfig;
};

export const createPairMatchModule = (): GameModule<PairMatchRoundState, RoundResult> => ({
  id: 'pair-match',
  titleKey: 'hub.memory',
  icon: '🧠',
  baseDifficulty: 'lv1',
  createRound: ({ difficulty, randomizer }: { difficulty: DifficultyLevel; randomizer: ControlledRandomizer }) => {
    const { deck, config } = createDeck(difficulty, randomizer);
    return { deck, config };
  },
  evaluate: ({ input }) => input
});
