import { ControlledRandomizer } from '@core/adaptive';
import { DifficultyLevel, GameModule, RoundResult } from '@core/engine';
import { createInitialRoundState } from './config';
import { OldMaidRoundState } from './types';

export type OldMaidModuleRoundState = OldMaidRoundState;

export const createOldMaidModule = (): GameModule<OldMaidRoundState, RoundResult> => ({
  id: 'old-maid',
  titleKey: 'hub.oldMaid',
  icon: '🃏',
  baseDifficulty: 'lv1',
  createRound: ({ difficulty, randomizer }: { difficulty: DifficultyLevel; randomizer: ControlledRandomizer }) =>
    createInitialRoundState(difficulty, randomizer),
  evaluate: ({ input }) => input
});
