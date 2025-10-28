
// おばけ一匹を表すオブジェクトの型
export type Ghost = {
  id: number;       // 識別するためのユニークなID
  char: string;     // 表示される文字
  x: number;        // X座標（%）
  y: number;        // Y座標（%）
};

// ゲームで出現する文字のリスト
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
