import { Card, AIAction, AILevelConfig, CardSprintGameState } from './types';
import { findPlayableCards, canPlayCard } from './config';

/**
 * カードの優先度を計算（高いほど出すべき）
 */
const calculateCardPriority = (card: Card, hand: Card[], pileA: Card | null, pileB: Card | null): number => {
  let priority = 0;

  // 両方の場札に出せるカードは優先度高
  const canPlayA = canPlayCard(card, pileA);
  const canPlayB = canPlayCard(card, pileB);
  if (canPlayA && canPlayB) {
    priority += 10;
  } else if (canPlayA || canPlayB) {
    priority += 5;
  }

  // 手札に同じ色が多い場合、その色を優先
  const sameColorCount = hand.filter((c) => c.color === card.color).length;
  priority += sameColorCount * 2;

  // 極端な数値（1や13）は優先度低め
  if (card.value === 1 || card.value === 13) {
    priority -= 3;
  }

  return priority;
};

/**
 * AI行動を決定
 */
export const decideAIAction = (
  state: CardSprintGameState,
  config: AILevelConfig,
  randomSeed: number
): AIAction => {
  const playableIndices = findPlayableCards(state.aiHand, state.pileA, state.pileB);

  // 出せるカードがない
  if (playableIndices.length === 0) {
    return {
      cardIndex: null,
      delayMs: config.baseDelayMs
    };
  }

  // 意図的ミス判定
  if (Math.random() < config.mistakeRate) {
    // わざと出さない
    return {
      cardIndex: null,
      delayMs: config.baseDelayMs + Math.random() * 200
    };
  }

  // 先読みなし：単純に出せるカードから選ぶ
  if (config.lookAheadDepth === 0) {
    const randomIndex = playableIndices[Math.floor(Math.random() * playableIndices.length)];
    return {
      cardIndex: randomIndex,
      delayMs: config.baseDelayMs + Math.random() * 100
    };
  }

  // 優先度ベースで選択
  const cardsWithPriority = playableIndices.map((index) => ({
    index,
    priority: calculateCardPriority(state.aiHand[index], state.aiHand, state.pileA, state.pileB)
  }));

  // 優先度でソート
  cardsWithPriority.sort((a, b) => b.priority - a.priority);

  // ブラフ：たまに優先度低いカードを選ぶ
  let selectedIndex: number;
  if (config.useBluff && Math.random() < 0.15) {
    // 下位30%からランダム選択
    const lowerThird = cardsWithPriority.slice(Math.floor(cardsWithPriority.length * 0.7));
    selectedIndex = lowerThird[Math.floor(Math.random() * lowerThird.length)]?.index ?? cardsWithPriority[0].index;
  } else {
    // 上位30%からランダム選択
    const topThird = cardsWithPriority.slice(0, Math.max(1, Math.ceil(cardsWithPriority.length * 0.3)));
    selectedIndex = topThird[Math.floor(Math.random() * topThird.length)].index;
  }

  return {
    cardIndex: selectedIndex,
    delayMs: config.baseDelayMs + Math.random() * 50
  };
};

/**
 * ゲーム終了判定
 */
export const checkGameEnd = (state: CardSprintGameState, gameDurationMs: number): boolean => {
  const elapsed = Date.now() - state.gameStartTime;

  // 時間切れ
  if (elapsed >= gameDurationMs) return true;

  // どちらかの手札がなくなった
  if (state.playerHand.length === 0 || state.aiHand.length === 0) return true;

  // デッキがなく、両者とも出せるカードがない
  if (state.deck.length === 0) {
    const playerPlayable = findPlayableCards(state.playerHand, state.pileA, state.pileB);
    const aiPlayable = findPlayableCards(state.aiHand, state.pileA, state.pileB);
    if (playerPlayable.length === 0 && aiPlayable.length === 0) return true;
  }

  return false;
};

/**
 * 勝者判定
 */
export const determineWinner = (state: CardSprintGameState): 'player' | 'ai' | 'draw' => {
  // 手札が少ない方が勝ち
  if (state.playerHand.length < state.aiHand.length) return 'player';
  if (state.aiHand.length < state.playerHand.length) return 'ai';

  // スコアで判定
  if (state.playerScore > state.aiScore) return 'player';
  if (state.aiScore > state.playerScore) return 'ai';

  return 'draw';
};
