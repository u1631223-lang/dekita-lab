
import React, { useState, useEffect, useCallback } from 'react';
import './KeyboardTypingScreen.css';
import { GameScreenProps } from '@core/engine';
import { Ghost, ALPHABET } from './types';
import { VirtualKeyboard } from '@ui/components/VirtualKeyboard';

// ゲーム画面のメインコンポーネント
export const KeyboardTypingScreen: React.FC<GameScreenProps> = ({ onRoundComplete }) => {
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [score, setScore] = useState(0);

  // 新しいおばけを生成する関数
  const addGhost = useCallback(() => {
    const char = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    const newGhost: Ghost = {
      id: Date.now() + Math.random(), // ユニークなID
      char,
      x: Math.random() * 80 + 10, // 画面の10%〜90%の位置
      y: 0, // 画面の上端からスタート
    };
    setGhosts((prev) => [...prev, newGhost]);
  }, []);

  // キー入力の処理
  const handleKeyDown = useCallback((e: { key: string }) => {
    const pressedKey = e.key.toUpperCase();
    setGhosts((prevGhosts) => {
      const targetGhost = prevGhosts.find((g) => g.char === pressedKey);
      if (targetGhost) {
        setScore((s) => s + 10); // スコア加算
        return prevGhosts.filter((g) => g.id !== targetGhost.id); // おばけを消す
      }
      return prevGhosts;
    });
  }, []);

  // 物理キーボード入力のイベントリスナー
  useEffect(() => {
    const physicalKeyDownHandler = (e: KeyboardEvent) => handleKeyDown(e);
    window.addEventListener('keydown', physicalKeyDownHandler);
    return () => window.removeEventListener('keydown', physicalKeyDownHandler);
  }, [handleKeyDown]);

  // ゲームループ：おばけを下に落とす
  useEffect(() => {
    const gameLoop = setInterval(() => {
      setGhosts((prevGhosts) =>
        prevGhosts
          .map((ghost) => ({ ...ghost, y: ghost.y + 2 })) // 少し下に移動
          .filter((ghost) => ghost.y < 100) // 画面下部に到達したら消す
      );
    }, 100);
    return () => clearInterval(gameLoop);
  }, []);

  // おばけ生成ループ
  useEffect(() => {
    const ghostGenerator = setInterval(addGhost, 2000); // 2秒ごとに新しいおばけ
    return () => clearInterval(ghostGenerator);
  }, [addGhost]);

  // 仮想キーボードからの入力ハンドラ
  const handleVirtualKeyPress = useCallback((key: string) => {
    handleKeyDown({ key });
  }, [handleKeyDown]);

  return (
    <div className="keyboard-typing-screen">
      <div className="game-hud">
        <p>Score: {score}</p>
        <button onClick={() => onRoundComplete({ success: true, reactionTimeMs: 0, hintsUsed: 0, endedAt: Date.now() })}>End Round</button>
      </div>
      <div className="game-area">
        {ghosts.map((ghost) => (
          <div
            key={ghost.id}
            className="ghost"
            style={{ top: `${ghost.y}%`, left: `${ghost.x}%` }}
          >
            {ghost.char}
          </div>
        ))}
      </div>
      <VirtualKeyboard onKeyPress={handleVirtualKeyPress} />
    </div>
  );
};
