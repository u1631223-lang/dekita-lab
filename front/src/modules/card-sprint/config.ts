import { ControlledRandomizer } from '@core/adaptive';
import { Card, CardColor, CardValue, CardSprintDifficultyMap, AILevelConfig } from './types';

/**
 * カードの色配列
 */
export const CARD_COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow'];

/**
 * AIレベル設定マップ
 * Lv1: 5歳児が必ず勝てる設定
 * Lv10: 大人が軽く集中すれば勝てる
 * Lv100: 上級者でも緊張感のある強さ
 */
export const AI_LEVEL_CONFIGS: Record<number, AILevelConfig> = {
  1: {
    level: 1,
    baseDelayMs: 800,
    mistakeRate: 0.3,
    lookAheadDepth: 0,
    useBluff: false,
    hintEnabled: true
  },
  5: {
    level: 5,
    baseDelayMs: 600,
    mistakeRate: 0.15,
    lookAheadDepth: 0,
    useBluff: false,
    hintEnabled: true
  },
  10: {
    level: 10,
    baseDelayMs: 350,
    mistakeRate: 0.05,
    lookAheadDepth: 1,
    useBluff: true,
    hintEnabled: false
  },
  20: {
    level: 20,
    baseDelayMs: 250,
    mistakeRate: 0.02,
    lookAheadDepth: 1,
    useBluff: true,
    hintEnabled: false
  },
  50: {
    level: 50,
    baseDelayMs: 150,
    mistakeRate: 0.01,
    lookAheadDepth: 2,
    useBluff: true,
    hintEnabled: false
  },
  100: {
    level: 100,
    baseDelayMs: 50,
    mistakeRate: 0.0,
    lookAheadDepth: 3,
    useBluff: true,
    hintEnabled: false
  }
};

/**
 * 難易度設定
 */
export const CARD_SPRINT_DIFFICULTY: CardSprintDifficultyMap = {
  lv1: {
    aiLevelRange: [1, 1],
    gameDurationMs: 60000, // 60秒
    hintsEnabled: true,
    deckSize: 20
  },
  lv2: {
    aiLevelRange: [1, 5],
    gameDurationMs: 60000,
    hintsEnabled: true,
    deckSize: 30
  },
  lv3: {
    aiLevelRange: [5, 10],
    gameDurationMs: 45000, // 45秒
    hintsEnabled: false,
    deckSize: 40
  },
  lv4: {
    aiLevelRange: [10, 50],
    gameDurationMs: 30000, // 30秒
    hintsEnabled: false,
    deckSize: 52
  },
  lv5: {
    aiLevelRange: [20, 50],
    gameDurationMs: 30000,
    hintsEnabled: false,
    deckSize: 52
  },
  lv6: {
    aiLevelRange: [50, 100],
    gameDurationMs: 30000,
    hintsEnabled: false,
    deckSize: 52
  }
};

/**
 * デッキを生成（シャッフル済み）
 */
export const createDeck = (size: number, randomizer: ControlledRandomizer): Card[] => {
  const cards: Card[] = [];
  let idCounter = 0;

  // 全カードを生成（色4種 × 数値13種 = 52枚）
  for (const color of CARD_COLORS) {
    for (let value = 1; value <= 13; value++) {
      cards.push({
        id: `${color}-${value}-${idCounter++}`,
        color,
        value: value as CardValue
      });
    }
  }

  // 指定サイズまで切り詰め
  const limitedCards = cards.slice(0, size);

  // Fisher-Yatesシャッフル
  for (let i = limitedCards.length - 1; i > 0; i--) {
    const j = Math.floor(randomizer.nextFloat() * (i + 1));
    [limitedCards[i], limitedCards[j]] = [limitedCards[j], limitedCards[i]];
  }

  return limitedCards;
};

/**
 * カードが場札に出せるかチェック
 */
export const canPlayCard = (card: Card, pileCard: Card | null): boolean => {
  if (!pileCard) return true;

  // 色が同じか、数値が±1以内なら出せる
  if (card.color === pileCard.color) return true;
  if (Math.abs(card.value - pileCard.value) === 1) return true;

  return false;
};

/**
 * 手札から出せるカードを検索
 */
export const findPlayableCards = (hand: Card[], pileA: Card | null, pileB: Card | null): number[] => {
  const playableIndices: number[] = [];

  hand.forEach((card, index) => {
    if (canPlayCard(card, pileA) || canPlayCard(card, pileB)) {
      playableIndices.push(index);
    }
  });

  return playableIndices;
};

/**
 * AIレベル設定を取得（補間あり）
 */
export const getAILevelConfig = (level: number): AILevelConfig => {
  // 定義されたレベルをソート
  const definedLevels = Object.keys(AI_LEVEL_CONFIGS)
    .map(Number)
    .sort((a, b) => a - b);

  // 完全一致
  if (AI_LEVEL_CONFIGS[level]) {
    return AI_LEVEL_CONFIGS[level];
  }

  // 補間
  let lowerLevel = definedLevels[0];
  let upperLevel = definedLevels[definedLevels.length - 1];

  for (const defined of definedLevels) {
    if (defined < level) {
      lowerLevel = defined;
    } else if (defined > level) {
      upperLevel = defined;
      break;
    }
  }

  const lowerConfig = AI_LEVEL_CONFIGS[lowerLevel];
  const upperConfig = AI_LEVEL_CONFIGS[upperLevel];

  // 線形補間
  const ratio = (level - lowerLevel) / (upperLevel - lowerLevel);
  return {
    level,
    baseDelayMs: Math.round(lowerConfig.baseDelayMs + (upperConfig.baseDelayMs - lowerConfig.baseDelayMs) * ratio),
    mistakeRate: lowerConfig.mistakeRate + (upperConfig.mistakeRate - lowerConfig.mistakeRate) * ratio,
    lookAheadDepth: ratio < 0.5 ? lowerConfig.lookAheadDepth : upperConfig.lookAheadDepth,
    useBluff: ratio < 0.5 ? lowerConfig.useBluff : upperConfig.useBluff,
    hintEnabled: ratio < 0.5 ? lowerConfig.hintEnabled : upperConfig.hintEnabled
  };
};
