import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionController } from '@app/session/SessionProvider';
import { RewardToast } from '@ui/components/RewardToast';
import { GameHud } from '@ui/components/GameHud';
import { useAudioCue } from '@ui/hooks/useAudioCue';
import { PairCard } from './types';
import { PairCard as PairCardComponent } from '@ui/components/PairCard';
import { PairMatchRoundState } from './module';
import './PairMatchScreen.css';

export const PairMatchScreen = () => {
  const {
    currentRound,
    recordRound,
    lastRecommendation,
    rewardSchedule,
    endSession,
    roundState,
    currentStats
  } = useSessionController();
  const { t } = useTranslation();
  const { play } = useAudioCue();
  const pairState = (roundState as PairMatchRoundState | null) ?? null;
  const [cards, setCards] = useState<PairCard[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [lockBoard, setLockBoard] = useState(true);
  const [hintReplays, setHintReplays] = useState(0);
  const reactionRef = useRef(performance.now());

  const config = useMemo(() => pairState?.config ?? null, [pairState]);
  const totalRounds = useMemo(() => {
    if (!currentRound || !currentStats || currentStats.gameId !== currentRound.gameId) {
      return 0;
    }
    return currentStats.summary.totalRounds;
  }, [currentRound, currentStats]);
  const growthPhase = Math.min(3, Math.floor(totalRounds / 4));
  const shouldAutoHide = growthPhase > 0;

  useEffect(() => {
    if (!currentRound || !pairState) {
      return;
    }
    setCards(pairState.deck.map((card) => ({ ...card, revealed: false, matched: false })));
    setSelected([]);
    setMistakes(0);
    const needsHint = lastRecommendation?.provideHint ?? false;
    setHintReplays(needsHint ? 1 : 0);
    const extraDelay = needsHint ? 400 : 0;
    const baseReveal = config?.revealMs ?? 1400;
    const revealDuration = shouldAutoHide ? baseReveal + extraDelay + growthPhase * 150 : null;
    revealAll(revealDuration);
  }, [currentRound?.roundId, pairState, lastRecommendation?.provideHint, config, shouldAutoHide, growthPhase]);

  const revealAll = (duration: number | null) => {
    setLockBoard(true);
    setCards((prev) => prev.map((card) => ({ ...card, revealed: true })));
    if (duration === null) {
      reactionRef.current = performance.now();
      setLockBoard(false);
      return;
    }
    window.setTimeout(() => {
      setCards((prev) => prev.map((card) => ({ ...card, revealed: card.matched })));
      setLockBoard(false);
      reactionRef.current = performance.now();
    }, duration);
  };

  const handleHint = () => {
    if (lockBoard || !config) {
      return;
    }
    setHintReplays((prev) => prev + 1);
    const revealDuration = shouldAutoHide ? config.revealMs + 400 : null;
    revealAll(revealDuration);
  };

  const updateCard = (id: string, patch: Partial<PairCard>) => {
    setCards((prev) => prev.map((card) => (card.id === id ? { ...card, ...patch } : card)));
  };

  const completeRound = (success: boolean) => {
    if (!currentRound) {
      return;
    }
    setLockBoard(true);
    recordRound({
      success,
      reactionTimeMs: Math.max(0, performance.now() - reactionRef.current),
      hintsUsed: hintReplays,
      endedAt: performance.now()
    });
  };

  const handleSelect = (card: PairCard) => {
    if (lockBoard || card.matched || card.revealed) {
      return;
    }
    play(card.audio);
    updateCard(card.id, { revealed: true });
    const nextSelected = [...selected, card.id];
    setSelected(nextSelected);

    if (nextSelected.length === 2) {
      setLockBoard(true);
      window.setTimeout(() => evaluatePair(nextSelected), 600);
    }
  };

  const evaluatePair = (ids: string[]) => {
    const [firstId, secondId] = ids;
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
      setLockBoard(false);
      const allMatched = nextCards.every((card) => card.matched);
      if (allMatched) {
        completeRound(true);
      }
    } else {
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      const nextCards = cards.map((card) =>
        card.id === first.id || card.id === second.id ? { ...card, revealed: false } : card
      );
      setCards(nextCards);
      setSelected([]);
      if (nextMistakes >= (config?.maxMistakes ?? 6)) {
        completeRound(false);
      } else {
        setLockBoard(false);
      }
    }
  };

  return (
    <div className="pair-screen">
      <header className="pair-header">
        <button className="pair-exit" onClick={endSession}>
          {t('actions.back', 'もどる')}
        </button>
        <div className="pair-status">
          <p>{t('pair.goal', 'おなじ えを そろえよう！')}</p>
          {config && (
            <p>
              {t('pair.mistakes', 'まちがい')} {mistakes}/{config.maxMistakes}
            </p>
          )}
        </div>
        <button className="pair-hint" onClick={handleHint} disabled={lockBoard || !config}>
          {t('rhythm.hint', 'ヒント')}×{hintReplays}
        </button>
      </header>

      <GameHud />

      <div className="pair-grid-wrapper">
        <section
          className="pair-grid"
          style={{ gridTemplateColumns: `repeat(${config?.columns ?? 3}, minmax(72px, 1fr))` }}
        >
          {cards.map((card) => (
            <PairCardComponent
              key={card.id}
              glyph={card.glyph}
              revealed={card.revealed}
              matched={card.matched}
              disabled={lockBoard || card.matched || card.revealed}
              onSelect={() => handleSelect(card)}
            />
          ))}
        </section>
      </div>
      <RewardToast schedule={rewardSchedule} />
    </div>
  );
};
