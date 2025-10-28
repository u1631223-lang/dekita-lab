import { ControlledRandomizer } from '@core/adaptive';
import { GameModule, RoundResult, DifficultyLevel } from '@core/engine';
import { createDeck, CARD_SPRINT_DIFFICULTY, getAILevelConfig } from './config';
import { CardSprintGameState, CardSprintDifficultyConfig } from './types';

export type CardSprintRoundState = {
  initialState: CardSprintGameState;
  config: CardSprintDifficultyConfig;
};

/**
 * 初期ゲーム状態を生成
 */
const createInitialGameState = (
  config: CardSprintDifficultyConfig,
  randomizer: ControlledRandomizer
): CardSprintGameState => {
  const deck = createDeck(config.deckSize, randomizer);

  // 各プレイヤーに5枚ずつ配る
  const playerHand = deck.splice(0, 5);
  const aiHand = deck.splice(0, 5);

  // 場札を2枚配置
  const pileA = deck.shift() ?? null;
  const pileB = deck.shift() ?? null;

  // AIレベルを範囲内でランダムに決定
  const [minLevel, maxLevel] = config.aiLevelRange;
  const aiLevel = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;

  return {
    playerHand,
    aiHand,
    deck,
    pileA,
    pileB,
    currentAILevel: aiLevel,
    playerScore: 0,
    aiScore: 0,
    gameStartTime: Date.now(),
    lastMoveTime: Date.now()
  };
};

export const createCardSprintModule = (): GameModule<CardSprintRoundState, RoundResult> => ({
  id: 'card-sprint',
  titleKey: 'hub.cardSprint',
  icon: '🃏',
  baseDifficulty: 'lv1',
  createRound: ({ difficulty, randomizer }: { difficulty: DifficultyLevel; randomizer: ControlledRandomizer }) => {
    const config = CARD_SPRINT_DIFFICULTY[difficulty] ?? CARD_SPRINT_DIFFICULTY.lv1;
    return {
      initialState: createInitialGameState(config, randomizer),
      config
    };
  },
  evaluate: ({ input }) => input
});
