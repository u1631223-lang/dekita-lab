import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionController } from '@app/session/SessionProvider';
import { useAudioCue } from '@ui/hooks/useAudioCue';
import { RewardToast } from '@ui/components/RewardToast';
import { GameHud } from '@ui/components/GameHud';
import { Card, CardSprintGameState } from './types';
import { CardSprintRoundState } from './module';
import { findPlayableCards, canPlayCard, getAILevelConfig } from './config';
import { decideAIAction, checkGameEnd, determineWinner } from './aiLogic';
import './CardSprintScreen.css';

export const CardSprintScreen = () => {
  const { currentRound, recordRound, lastRecommendation, rewardSchedule, endSession, roundState } =
    useSessionController();
  const { play } = useAudioCue();
  const { t } = useTranslation();

  const sprintState = (roundState as CardSprintRoundState | null) ?? null;
  const [gameState, setGameState] = useState<CardSprintGameState | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'player' | 'ai' | 'draw' | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);

  const reactionRef = useRef(performance.now());
  const aiTimerRef = useRef<number | null>(null);
  const gameTimerRef = useRef<number | null>(null);

  // 初期化
  useEffect(() => {
    if (!currentRound || !sprintState) {
      return;
    }

    setGameState(sprintState.initialState);
    setFeedback(null);
    setHintsUsed(0);
    setShowHint(false);
    reactionRef.current = performance.now();

    // AIの行動ループを開始
    startAILoop();

    // ゲーム終了タイマー
    const endTimer = window.setTimeout(() => {
      endGame();
    }, sprintState.config.gameDurationMs);
    gameTimerRef.current = endTimer;

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      if (gameTimerRef.current) clearTimeout(gameTimerRef.current);
    };
  }, [currentRound?.roundId, sprintState]);

  // AIの行動ループ
  const startAILoop = () => {
    if (!gameState || !sprintState) return;

    const aiConfig = getAILevelConfig(gameState.currentAILevel);
    const action = decideAIAction(gameState, aiConfig, Date.now());

    aiTimerRef.current = window.setTimeout(() => {
      executeAIAction(action.cardIndex);
    }, action.delayMs);
  };

  // AI行動の実行
  const executeAIAction = (cardIndex: number | null) => {
    if (!gameState || !sprintState) return;

    if (cardIndex !== null && cardIndex < gameState.aiHand.length) {
      const card = gameState.aiHand[cardIndex];

      // どちらの場札に出すか決定
      const canPlayA = canPlayCard(card, gameState.pileA);
      const canPlayB = canPlayCard(card, gameState.pileB);

      let targetPile: 'A' | 'B' | null = null;
      if (canPlayA && canPlayB) {
        targetPile = Math.random() < 0.5 ? 'A' : 'B';
      } else if (canPlayA) {
        targetPile = 'A';
      } else if (canPlayB) {
        targetPile = 'B';
      }

      if (targetPile) {
        const newHand = [...gameState.aiHand];
        newHand.splice(cardIndex, 1);

        // デッキから補充
        let newDeck = [...gameState.deck];
        if (newDeck.length > 0) {
          newHand.push(newDeck.shift()!);
        }

        const newState: CardSprintGameState = {
          ...gameState,
          aiHand: newHand,
          deck: newDeck,
          pileA: targetPile === 'A' ? card : gameState.pileA,
          pileB: targetPile === 'B' ? card : gameState.pileB,
          aiScore: gameState.aiScore + 1,
          lastMoveTime: Date.now()
        };

        setGameState(newState);
        play('tap');

        // ゲーム終了チェック
        if (checkGameEnd(newState, sprintState.config.gameDurationMs)) {
          endGame();
          return;
        }
      }
    }

    // 次のAI行動をスケジュール
    startAILoop();
  };

  // プレイヤーのカード選択
  const handleCardClick = (index: number) => {
    if (!gameState || !sprintState || feedback) return;

    const card = gameState.playerHand[index];
    const canPlayA = canPlayCard(card, gameState.pileA);
    const canPlayB = canPlayCard(card, gameState.pileB);

    if (!canPlayA && !canPlayB) {
      play('error');
      return;
    }

    setSelectedCardIndex(index);
  };

  // ドラッグ開始
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!gameState || !sprintState || feedback) return;

    const card = gameState.playerHand[index];
    const canPlayA = canPlayCard(card, gameState.pileA);
    const canPlayB = canPlayCard(card, gameState.pileB);

    if (!canPlayA && !canPlayB) {
      e.preventDefault();
      play('error');
      return;
    }

    setDraggedCardIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  // ドラッグ終了
  const handleDragEnd = () => {
    setDraggedCardIndex(null);
  };

  // ドロップ許可
  const handleDragOver = (e: React.DragEvent, pile: 'A' | 'B') => {
    if (!gameState || draggedCardIndex === null || feedback) return;

    const card = gameState.playerHand[draggedCardIndex];
    const targetCard = pile === 'A' ? gameState.pileA : gameState.pileB;

    if (canPlayCard(card, targetCard)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  // ドロップ処理
  const handleDrop = (e: React.DragEvent, pile: 'A' | 'B') => {
    e.preventDefault();
    if (!gameState || !sprintState || draggedCardIndex === null || feedback) return;

    const card = gameState.playerHand[draggedCardIndex];
    const targetCard = pile === 'A' ? gameState.pileA : gameState.pileB;

    if (!canPlayCard(card, targetCard)) {
      play('error');
      setDraggedCardIndex(null);
      return;
    }

    // カードを場に出す処理（handlePileClickと同じロジック）
    playCardToPile(draggedCardIndex, pile);
    setDraggedCardIndex(null);
  };

  // カードを場に出す共通処理
  const playCardToPile = (cardIndex: number, pile: 'A' | 'B') => {
    if (!gameState || !sprintState) return;

    const newHand = [...gameState.playerHand];
    const card = newHand.splice(cardIndex, 1)[0];

    // デッキから補充
    let newDeck = [...gameState.deck];
    if (newDeck.length > 0) {
      newHand.push(newDeck.shift()!);
    }

    const newState: CardSprintGameState = {
      ...gameState,
      playerHand: newHand,
      deck: newDeck,
      pileA: pile === 'A' ? card : gameState.pileA,
      pileB: pile === 'B' ? card : gameState.pileB,
      playerScore: gameState.playerScore + 1,
      lastMoveTime: Date.now()
    };

    setGameState(newState);
    setSelectedCardIndex(null);
    play('success');

    // ゲーム終了チェック
    if (checkGameEnd(newState, sprintState.config.gameDurationMs)) {
      endGame();
    }
  };

  // 場札への配置（クリック操作用）
  const handlePileClick = (pile: 'A' | 'B') => {
    if (!gameState || !sprintState || selectedCardIndex === null || feedback) return;

    const card = gameState.playerHand[selectedCardIndex];
    const targetCard = pile === 'A' ? gameState.pileA : gameState.pileB;

    if (!canPlayCard(card, targetCard)) {
      play('error');
      return;
    }

    playCardToPile(selectedCardIndex, pile);
  };

  // ヒント表示
  const handleHint = () => {
    if (!gameState || !sprintState?.config.hintsEnabled || showHint) return;

    setShowHint(true);
    setHintsUsed((prev) => prev + 1);
    play('hint');

    setTimeout(() => setShowHint(false), 2000);
  };

  // ゲーム終了
  const endGame = () => {
    if (!gameState || !currentRound || feedback) return;

    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    if (gameTimerRef.current) clearTimeout(gameTimerRef.current);

    const winner = determineWinner(gameState);
    const success = winner === 'player';

    setFeedback(winner);
    play(success ? 'success' : 'miss');

    setTimeout(() => {
      recordRound({
        success,
        reactionTimeMs: Math.max(0, performance.now() - reactionRef.current),
        hintsUsed,
        endedAt: Date.now()
      });
    }, 1500);
  };

  if (!currentRound || !sprintState || !gameState) {
    return <div className="card-sprint-loading">{t('loading')}</div>;
  }

  const playableIndices = showHint ? findPlayableCards(gameState.playerHand, gameState.pileA, gameState.pileB) : [];

  return (
    <div className="card-sprint-screen">
      <GameHud />

      <div className="card-sprint-game">
        {/* AI手札エリア */}
        <div className="card-sprint-ai-area">
          <div className="card-sprint-hand">
            {gameState.aiHand.map((card, index) => (
              <div key={card.id} className="card-sprint-card card-back">
                🂠
              </div>
            ))}
          </div>
          <div className="card-sprint-score">AI: {gameState.aiScore}</div>
        </div>

        {/* 場札エリア */}
        <div className="card-sprint-piles">
          <div
            className={`card-sprint-pile ${selectedCardIndex !== null && canPlayCard(gameState.playerHand[selectedCardIndex], gameState.pileA) ? 'playable' : ''}`}
            onClick={() => handlePileClick('A')}
          >
            {gameState.pileA ? renderCard(gameState.pileA) : <div className="card-empty">A</div>}
          </div>

          <div className="card-sprint-deck-info">
            <div className="card-sprint-deck-count">山札: {gameState.deck.length}</div>
            {sprintState.config.hintsEnabled && (
              <button className="card-sprint-hint-btn" onClick={handleHint} disabled={showHint}>
                💡 ヒント
              </button>
            )}
          </div>

          <div
            className={`card-sprint-pile ${selectedCardIndex !== null && canPlayCard(gameState.playerHand[selectedCardIndex], gameState.pileB) ? 'playable' : ''}`}
            onClick={() => handlePileClick('B')}
          >
            {gameState.pileB ? renderCard(gameState.pileB) : <div className="card-empty">B</div>}
          </div>
        </div>

        {/* プレイヤー手札エリア */}
        <div className="card-sprint-player-area">
          <div className="card-sprint-score">プレイヤー: {gameState.playerScore}</div>
          <div className="card-sprint-hand">
            {gameState.playerHand.map((card, index) => (
              <div
                key={card.id}
                className={`card-sprint-card ${selectedCardIndex === index ? 'selected' : ''} ${playableIndices.includes(index) ? 'hint-highlight' : ''}`}
                onClick={() => handleCardClick(index)}
              >
                {renderCard(card)}
              </div>
            ))}
          </div>
        </div>

        {/* フィードバック */}
        {feedback && (
          <div className={`card-sprint-feedback feedback-${feedback === 'player' ? 'win' : feedback === 'ai' ? 'lose' : 'draw'}`}>
            {feedback === 'player' && '🎉 勝利！'}
            {feedback === 'ai' && '😢 敗北'}
            {feedback === 'draw' && '🤝 引き分け'}
          </div>
        )}
      </div>

      <RewardToast schedule={rewardSchedule} />
    </div>
  );
};

/**
 * カードをレンダリング
 */
const renderCard = (card: Card) => {
  const colorMap: Record<string, string> = {
    red: '♥️',
    blue: '♦️',
    green: '♣️',
    yellow: '♠️'
  };

  return (
    <div className={`card-content color-${card.color}`}>
      <div className="card-symbol">{colorMap[card.color]}</div>
      <div className="card-value">{card.value}</div>
    </div>
  );
};
