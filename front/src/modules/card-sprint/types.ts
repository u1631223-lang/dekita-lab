import { DifficultyLevel } from '@core/engine';

/**
 * カードの色（数字ではなく色名で表現）
 */
export type CardColor = 'red' | 'blue' | 'green' | 'yellow';

/**
 * カードの数値（1-13）
 */
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

/**
 * 個々のカード
 */
export interface Card {
  id: string;
  color: CardColor;
  value: CardValue;
}

/**
 * AIの行動決定
 */
export interface AIAction {
  cardIndex: number | null; // 出すカードのインデックス、nullは出せない
  delayMs: number; // 実行までの遅延時間
}

/**
 * AIレベル設定
 */
export interface AILevelConfig {
  level: number;
  baseDelayMs: number; // 基本入力遅延
  mistakeRate: number; // 意図的ミス率（0.0-1.0）
  lookAheadDepth: number; // 先読み深度（0=なし、1=1手先まで）
  useBluff: boolean; // ブラフ（わざと不利なカード）を使うか
  hintEnabled: boolean; // ヒント表示有効
}

/**
 * ゲーム状態
 */
export interface CardSprintGameState {
  playerHand: Card[];
  aiHand: Card[];
  deck: Card[];
  pileA: Card | null;
  pileB: Card | null;
  currentAILevel: number;
  playerScore: number;
  aiScore: number;
  gameStartTime: number;
  lastMoveTime: number;
}

/**
 * 難易度ごとの設定
 */
export interface CardSprintDifficultyConfig {
  aiLevelRange: [number, number]; // [最小, 最大]レベル
  gameDurationMs: number; // 1ゲームの制限時間
  hintsEnabled: boolean;
  deckSize: number; // 使用するカードの枚数
}

export type CardSprintDifficultyMap = Record<DifficultyLevel, CardSprintDifficultyConfig>;
