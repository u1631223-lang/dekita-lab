
import { GameModule, RoundResult } from '@core/engine';
import { KeyboardTypingScreen } from './KeyboardTypingScreen';

// このゲーム特有のラウンド状態や結果の型定義（今回はシンプルに）
export type KeyboardTypingRoundState = {
  level: number;
};
export type KeyboardTypingResult = RoundResult;

// ゲームモジュールの実体
export const createKeyboardTypingModule = (): GameModule<
  KeyboardTypingRoundState,
  KeyboardTypingResult
> => ({
  id: 'keyboard-typing',
  titleKey: 'hub.keyboardTyping', // 国際化対応のためのキー
  icon: '👻', // ゲームのアイコン
  baseDifficulty: 'lv1',
  screen: KeyboardTypingScreen, // ゲーム画面のコンポーネント

  // ラウンド作成ロジック（今は仮）
  createRound: ({ difficulty }) => {
    console.log('Creating round for difficulty:', difficulty);
    return {
      level: 1,
    };
  },

  // 評価ロジック（今は仮）
  evaluate: ({ input }) => {
    console.log('Evaluating input:', input);
    return {
      isCorrect: true,
      score: 10,
    };
  },
});
