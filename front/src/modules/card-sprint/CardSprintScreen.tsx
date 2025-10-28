import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
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
  const [dragState, setDragState] = useState<{
    index: number;
    card: Card;
    x: number;
    y: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    pointerId: number;
    isDragging: boolean;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<'A' | 'B' | null>(null);

  const reactionRef = useRef(performance.now());
  const aiTimerRef = useRef<number | null>(null);
  const gameTimerRef = useRef<number | null>(null);
  const pileARef = useRef<HTMLDivElement | null>(null);
  const pileBRef = useRef<HTMLDivElement | null>(null);
  const skipClickRef = useRef(false);

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

  // 停滞時に場札を更新（スピードのルールに合わせる）
  useEffect(() => {
    if (!gameState || !sprintState) return;

    const playerMoves = findPlayableCards(gameState.playerHand, gameState.pileA, gameState.pileB).length;
    const aiMoves = findPlayableCards(gameState.aiHand, gameState.pileA, gameState.pileB).length;

    if (playerMoves > 0 || aiMoves > 0) {
      return;
    }
    if (gameState.deck.length === 0) {
      return;
    }

    let updated = false;
    setGameState((prev) => {
      if (!prev || prev.deck.length === 0) return prev;
      const updatedDeck = [...prev.deck];
      const nextPileA = updatedDeck.shift() ?? null;
      const nextPileB = updatedDeck.shift() ?? null;

      if (!nextPileA && !nextPileB) {
        return prev;
      }

      updated = true;
      return {
        ...prev,
        deck: updatedDeck,
        pileA: nextPileA ?? prev.pileA,
        pileB: nextPileB ?? prev.pileB,
        lastMoveTime: Date.now()
      };
    });

    if (updated) {
      play('tap');
    }
  }, [gameState, sprintState, play]);

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

    if (skipClickRef.current) {
      skipClickRef.current = false;
      return;
    }

    const card = gameState.playerHand[index];
    const canPlayA = canPlayCard(card, gameState.pileA);
    const canPlayB = canPlayCard(card, gameState.pileB);

    if (!canPlayA && !canPlayB) {
      play('error');
      return;
    }

    setSelectedCardIndex(index);
  };

  const determineDropTarget = (clientX: number, clientY: number): 'A' | 'B' | null => {
    const isWithin = (element: HTMLDivElement | null) => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    };

    if (isWithin(pileARef.current)) return 'A';
    if (isWithin(pileBRef.current)) return 'B';
    return null;
  };

  const handleCardPointerDown = (event: ReactPointerEvent<HTMLDivElement>, index: number) => {
    if (!gameState || !sprintState || feedback) return;

    const card = gameState.playerHand[index];
    const canPlayA = canPlayCard(card, gameState.pileA);
    const canPlayB = canPlayCard(card, gameState.pileB);

    if (!canPlayA && !canPlayB) {
      play('error');
      return;
    }

    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();

    skipClickRef.current = false;
    setSelectedCardIndex(index);
    element.setPointerCapture(event.pointerId);
    event.preventDefault();

    setDragState({
      index,
      card,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      pointerId: event.pointerId,
      isDragging: false
    });
    setDropTarget(null);
  };

  const handleCardPointerMove = (event: ReactPointerEvent<HTMLDivElement>, index: number) => {
    if (!dragState || dragState.index !== index) return;

    const nextX = event.clientX;
    const nextY = event.clientY;
    const distance = Math.hypot(nextX - dragState.startX, nextY - dragState.startY);
    const isDragging = dragState.isDragging || distance > 6;
    const updatedState = {
      ...dragState,
      x: nextX,
      y: nextY,
      isDragging
    };

    setDragState(updatedState);
    event.preventDefault();

    if (!isDragging || !gameState) {
      setDropTarget(null);
      return;
    }

    const target = determineDropTarget(nextX, nextY);
    if (!target) {
      setDropTarget(null);
      return;
    }

    const targetCard = target === 'A' ? gameState.pileA : gameState.pileB;
    if (canPlayCard(updatedState.card, targetCard)) {
      setDropTarget(target);
    } else {
      setDropTarget(null);
    }
  };

  const handleCardPointerUp = (event: ReactPointerEvent<HTMLDivElement>, index: number) => {
    if (!dragState || dragState.index !== index) return;

    const currentDrag = dragState;
    setDragState(null);
    setDropTarget(null);

    event.currentTarget.releasePointerCapture(currentDrag.pointerId);
    event.preventDefault();

    if (!currentDrag.isDragging) {
      return;
    }

    skipClickRef.current = true;

    if (!gameState) return;

    const drop = determineDropTarget(event.clientX, event.clientY);
    if (!drop) {
      play('error');
      return;
    }

    const targetCard = drop === 'A' ? gameState.pileA : gameState.pileB;
    if (!canPlayCard(currentDrag.card, targetCard)) {
      play('error');
      return;
    }

    const resolvedIndex = gameState.playerHand.findIndex((handCard) => handCard.id === currentDrag.card.id);
    if (resolvedIndex === -1) {
      return;
    }

    playCardToPile(resolvedIndex, drop);
  };

  const handleCardPointerCancel = (event: ReactPointerEvent<HTMLDivElement>, index: number) => {
    if (!dragState || dragState.index !== index) return;
    event.currentTarget.releasePointerCapture(dragState.pointerId);
    setDragState(null);
    setDropTarget(null);
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
      <header className="card-sprint-header">
        <button type="button" className="card-sprint-exit" onClick={endSession}>
          {t('actions.back', 'もどる')}
        </button>
        <p className="card-sprint-instruction">{t('cardSprint.goal', 'まんなかのカードにつながる かーどを だそう！')}</p>
        <span className="card-sprint-placeholder" aria-hidden="true" />
      </header>
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
            ref={pileARef}
            className={`card-sprint-pile ${selectedCardIndex !== null && canPlayCard(gameState.playerHand[selectedCardIndex], gameState.pileA) ? 'playable' : ''} ${dropTarget === 'A' ? 'drop-target' : ''}`}
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
            ref={pileBRef}
            className={`card-sprint-pile ${selectedCardIndex !== null && canPlayCard(gameState.playerHand[selectedCardIndex], gameState.pileB) ? 'playable' : ''} ${dropTarget === 'B' ? 'drop-target' : ''}`}
            onClick={() => handlePileClick('B')}
          >
            {gameState.pileB ? renderCard(gameState.pileB) : <div className="card-empty">B</div>}
          </div>
        </div>

        {/* プレイヤー手札エリア */}
        <div className="card-sprint-player-area">
          <div className="card-sprint-score">プレイヤー: {gameState.playerScore}</div>
          <div className="card-sprint-hand">
            {gameState.playerHand.map((card, index) => {
              const isDraggingCard = dragState?.index === index && dragState.isDragging;
              const classes = [
                'card-sprint-card',
                selectedCardIndex === index ? 'selected' : '',
                playableIndices.includes(index) ? 'hint-highlight' : '',
                isDraggingCard ? 'dragging-hidden' : ''
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div
                  key={card.id}
                  className={classes}
                  onClick={() => handleCardClick(index)}
                  onPointerDown={(event) => handleCardPointerDown(event, index)}
                  onPointerMove={(event) => handleCardPointerMove(event, index)}
                  onPointerUp={(event) => handleCardPointerUp(event, index)}
                  onPointerCancel={(event) => handleCardPointerCancel(event, index)}
                >
                  {renderCard(card)}
                </div>
              );
            })}
          </div>

          {dragState?.isDragging && (
            <div
              className="card-sprint-card card-sprint-drag-ghost"
              style={{
                left: `${dragState.x - dragState.offsetX}px`,
                top: `${dragState.y - dragState.offsetY}px`
              }}
            >
              {renderCard(dragState.card)}
            </div>
          )}
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
