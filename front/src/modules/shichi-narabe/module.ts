import { ControlledRandomizer } from '@core/adaptive';
import { DifficultyLevel, GameModule, RoundResult } from '@core/engine';
import { createInitialShichiNarabeState } from './logic';
import { ShichiNarabeRoundState } from './types';

export const createShichiNarabeModule = (): GameModule<ShichiNarabeRoundState, RoundResult> => ({
  id: 'shichi-narabe',
  titleKey: 'hub.shichiNarabe',
  icon: '7️⃣',
  baseDifficulty: 'lv1',
  createRound: ({
    difficulty,
    randomizer
  }: {
    difficulty: DifficultyLevel;
    randomizer: ControlledRandomizer;
  }) => createInitialShichiNarabeState(difficulty, randomizer),
  evaluate: ({ input }) => input
});
