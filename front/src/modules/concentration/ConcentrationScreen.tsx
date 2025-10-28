import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionController } from '@app/session/SessionProvider';
import { RewardToast } from '@ui/components/RewardToast';
import { GameHud } from '@ui/components/GameHud';
import { useAudioCue } from '@ui/hooks/useAudioCue';
import { ConcentrationRoundState } from './module';
import { ConcentrationCard as CardType, Suit } from './types';
import { ConcentrationCard } from './ConcentrationCard';
import './ConcentrationScreen.css';

const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

const clearTimeoutRef = (ref: MutableRefObject<number | undefined>) => {
  if (ref.current) {
    window.clearTimeout(ref.current);
    ref.current = undefined;
  }
};

export const ConcentrationScreen = () => {
  const {
    currentRound,
    recordRound,
    rewardSchedule,
    endSession,
    roundState,
    lastRecommendation,
    currentStats
  } = useSessionController();
  const { t } = useTranslation();
  const { play } = useAudioCue();
  const roundStateValue = (roundState as ConcentrationRoundState | null) ?? null;
  const [cards, setCards] = useState<CardType[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [lockBoard, setLockBoard] = useState(true);
  const [hintReveals, setHintReveals] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const reactionRef = useRef(performance.now());
  const previewTimerRef = useRef<number>();
  const hideTimerRef = useRef<number>();
  const evaluationTimerRef = useRef<number>();

  const config = roundStateValue?.config ?? null;
  const totalPairs = useMemo(() => (config ? (config.rows * config.columns) / 2 : 0), [config]);
  const matchedPairs = useMemo(() => cards.filter((card) => card.matched).length / 2, [cards]);
  const remainingPairs = Math.max(totalPairs - matchedPairs, 0);

  const totalRounds = useMemo(() => {
    if (!currentRound || !currentStats || currentStats.gameId !== currentRound.gameId) {
      return 0;
    }
    return currentStats.summary.totalRounds;
  }, [currentRound, currentStats]);

  const initialPreviewMs = useMemo(() => {
    if (!config) {
      return null;
    }
    const base = Math.max(config.hideDelayMs + 800 - totalRounds * 80, 1600);
    return (lastRecommendation?.provideHint ?? false) ? base + 400 : base;
  }, [config, totalRounds, lastRecommendation?.provideHint]);

  const unlockBoard = useCallback(() => {
    setLockBoard(false);
    reactionRef.current = performance.now();
  }, []);

  const cancelTimers = useCallback(() => {
    clearTimeoutRef(previewTimerRef);
    clearTimeoutRef(hideTimerRef);
    clearTimeoutRef(evaluationTimerRef);
  }, []);

  useEffect(() => {
    cancelTimers();
    if (!currentRound || !roundStateValue) {
      setCards([]);
      return;
    }
    const deck = roundStateValue.deck.map((card) => ({ ...card, matched: false, revealed: true }));
    setCards(deck);
    setSelected([]);
    setMistakes(0);
    setLockBoard(true);
    setHintReveals((lastRecommendation?.provideHint ?? false) ? 1 : 0);

    const preview = initialPreviewMs;
    if (preview !== null) {
      previewTimerRef.current = window.setTimeout(() => {
        setCards((prev) => prev.map((card) => ({ ...card, revealed: card.matched })));
        unlockBoard();
      }, preview);
    } else {
      setCards(deck.map((card) => ({ ...card, revealed: card.matched })));
      unlockBoard();
    }

    return cancelTimers;
  }, [currentRound, roundStateValue, lastRecommendation?.provideHint, initialPreviewMs, cancelTimers, unlockBoard]);

  useEffect(() => cancelTimers, [cancelTimers]);

  const completeRound = useCallback(
    (success: boolean) => {
      if (!currentRound) {
        return;
      }
      cancelTimers();
      setLockBoard(true);
      recordRound({
        success,
        reactionTimeMs: Math.max(0, performance.now() - reactionRef.current),
        hintsUsed: hintReveals,
        endedAt: performance.now()
      });
    },
    [currentRound, recordRound, cancelTimers, hintReveals]
  );

  const revealAll = useCallback(
    (duration: number | null) => {
      if (!config) {
        return;
      }
      cancelTimers();
      setLockBoard(true);
      setCards((prev) => prev.map((card) => ({ ...card, revealed: true })));
      setSelected([]);
      if (duration === null) {
        unlockBoard();
        return;
      }
      previewTimerRef.current = window.setTimeout(() => {
        setCards((prev) => prev.map((card) => ({ ...card, revealed: card.matched })));
        unlockBoard();
      }, duration);
    },
    [cancelTimers, config, unlockBoard]
  );

  const handleHint = () => {
    if (lockBoard || !config) {
      return;
    }
    setHintReveals((prev) => prev + 1);
    revealAll(config.hideDelayMs + 600);
  };

  const evaluatePair = useCallback(
    (firstId: string, secondId: string) => {
      clearTimeoutRef(evaluationTimerRef);
      const first = cards.find((card) => card.id === firstId);
      const second = cards.find((card) => card.id === secondId);
      if (!first || !second || !config) {
        setSelected([]);
        setLockBoard(false);
        return;
      }
      if (first.pairId === second.pairId) {
        const nextCards = cards.map((card) =>
          card.id === first.id || card.id === second.id ? { ...card, matched: true, revealed: true } : card
        );
        setCards(nextCards);
        setSelected([]);
        play(`concentration-match-${first.pairId}`);
        const allMatched = nextCards.every((card) => card.matched);
        if (allMatched) {
          completeRound(true);
        } else {
          setLockBoard(false);
        }
      } else {
        play('concentration-miss');
        setMistakes((prev) => prev + 1);
        hideTimerRef.current = window.setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === first.id || card.id === second.id ? { ...card, revealed: false } : card
            )
          );
          setSelected([]);
          setLockBoard(false);
        }, config.hideDelayMs);
      }
    },
    [cards, config, completeRound, play]
  );

  const handleSelect = (card: CardType) => {
    if (lockBoard || card.matched || card.revealed) {
      return;
    }
    setCards((prev) => prev.map((item) => (item.id === card.id ? { ...item, revealed: true } : item)));
    setSelected((prev) => {
      const next = [...prev, card.id];
      if (next.length === 2) {
        setLockBoard(true);
        evaluationTimerRef.current = window.setTimeout(() => evaluatePair(next[0], next[1]), 420);
      }
      return next;
    });
  };

  return (
    <div className="concentration-screen">
      <header className="concentration-header">
        <button className="concentration-exit" onClick={endSession}>
          {t('actions.back', 'もどる')}
        </button>
        <div className="concentration-status" role="status" aria-live="polite">
          <p>{t('concentration.goal', 'おなじ ランクを そろえよう！')}</p>
          {config ? (
            <>
              <p>
                {t('concentration.remaining', 'のこりのペア')} {remainingPairs}
              </p>
              <p>
                {t('concentration.pairs', '{{found}} / {{total}} ペア', {
                  found: matchedPairs,
                  total: totalPairs
                })}
              </p>
              <p>
                {t('concentration.mistakes', 'まちがい')} {mistakes}
              </p>
            </>
          ) : null}
        </div>
        <button className="concentration-hint" onClick={handleHint} disabled={lockBoard || !config}>
          {t('concentration.hint', 'ヒント')}
          <span className="concentration-hint__count">×{hintReveals}</span>
        </button>
      </header>

      <GameHud />

      <div className="concentration-grid-wrapper">
        <section
          className="concentration-grid"
          style={{ gridTemplateColumns: `repeat(${config?.columns ?? 4}, minmax(60px, 1fr))` }}
        >
          {cards.map((card) => {
            const suitLabel = t(`concentration.suits.${card.suit}`, card.suit);
            const ariaLabel = t('concentration.cardLabel', {
              rank: card.rank,
              suit: suitLabel
            });
            return (
              <ConcentrationCard
                key={card.id}
                rank={card.rank}
                suitSymbol={SUIT_SYMBOL[card.suit]}
                color={card.color}
                revealed={card.revealed}
                matched={card.matched}
                disabled={lockBoard || card.matched || card.revealed}
                onSelect={() => handleSelect(card)}
                ariaLabel={ariaLabel}
              />
            );
          })}
        </section>
      </div>
      <RewardToast schedule={rewardSchedule} />
    </div>
  );
};
