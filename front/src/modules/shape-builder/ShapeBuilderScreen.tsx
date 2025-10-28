import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionController } from '@app/session/SessionProvider';
import { RewardToast } from '@ui/components/RewardToast';
import { GameHud } from '@ui/components/GameHud';
import { useAudioCue } from '@ui/hooks/useAudioCue';
import { ShapeBuilderRoundState } from './types';
import './ShapeBuilderScreen.css';

export const ShapeBuilderScreen = () => {
  const { currentRound, recordRound, lastRecommendation, rewardSchedule, endSession, roundState, currentStats } =
    useSessionController();
  const { t } = useTranslation();
  const { play } = useAudioCue();
  const builderState = (roundState as ShapeBuilderRoundState | null) ?? null;
  const cells = builderState?.cells ?? [];
  const available = builderState?.available ?? [];
  const totalRounds = currentStats && currentRound && currentStats.gameId === currentRound.gameId ? currentStats.summary.totalRounds : 0;
  const phase = Math.min(3, Math.floor(totalRounds / 4));
  const [step, setStep] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState<'success' | 'miss' | null>(null);
  const [lockBoard, setLockBoard] = useState(false);
  const [hintTarget, setHintTarget] = useState<string | null>(null);
  const timerRef = useRef<number>();
  const reactionRef = useRef(performance.now());

  const targetCell = cells[step];
  const previewCount = builderState?.config.autoReveal ? Math.max(1, 3 - phase) : Math.max(0, 2 - phase);
  const previewCells = useMemo(() => cells.slice(step, step + previewCount).map((cell) => cell.id), [cells, step, previewCount]);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  };

  useEffect(() => clearTimer, []);

  useEffect(() => {
    if (!builderState || !currentRound) {
      return;
    }
    setStep(0);
    setHintsUsed(lastRecommendation?.provideHint ? 1 : 0);
    setFeedback(null);
    setLockBoard(false);
    setHintTarget(null);
    reactionRef.current = performance.now();
  }, [builderState, currentRound?.roundId]);

  const completeRound = (success: boolean) => {
    if (!currentRound) {
      return;
    }
    setLockBoard(true);
    setFeedback(success ? 'success' : 'miss');
    recordRound({
      success,
      reactionTimeMs: Math.max(0, performance.now() - reactionRef.current),
      hintsUsed,
      endedAt: performance.now()
    });
  };

  const handleTokenSelect = (tokenId: string) => {
    if (!targetCell || lockBoard) {
      return;
    }
    play(tokenId);
    if (tokenId !== targetCell.target) {
      completeRound(false);
      return;
    }
    const nextStep = step + 1;
    setStep(nextStep);
    if (nextStep >= cells.length) {
      completeRound(true);
    }
  };

  const handleHint = () => {
    if (lockBoard || !targetCell) {
      return;
    }
    setHintsUsed((prev) => prev + 1);
    setFeedback(null);
    setHintTarget(targetCell.id);
    setLockBoard(true);
    window.setTimeout(() => {
      setHintTarget(null);
      setLockBoard(false);
    }, 900);
  };

  return (
    <div className="builder-screen">
      <header className="builder-header">
        <button className="builder-exit" onClick={endSession}>
          {t('actions.back', 'もどる')}
        </button>
        <div className="builder-status">
          <span>
            {targetCell
              ? t('shape.target', { defaultValue: 'つぎは この かたち！' })
              : t('reward.goodJob')}
          </span>
          {feedback === 'miss' && <span className="builder-feedback builder-feedback--miss">{t('sequence.tryAgain', 'もう いちど！')}</span>}
          {feedback === 'success' && <span className="builder-feedback builder-feedback--success">{t('reward.goodJob')}</span>}
        </div>
        <button className="builder-hint" onClick={handleHint} disabled={lockBoard}>
          {t('rhythm.hint', 'ヒント')}×{hintsUsed}
        </button>
      </header>

      <GameHud />

      <section
        className="builder-grid"
        style={{ gridTemplateColumns: `repeat(${builderState?.config.columns ?? 2}, minmax(80px, 1fr))` }}
      >
        {cells.map((cell, index) => {
          const isTarget = targetCell?.id === cell.id;
          const showPreview = previewCells.includes(cell.id) && index >= step;
          const showHint = hintTarget === cell.id;
          return (
            <div
              key={cell.id}
              className={`builder-cell ${index < step ? 'builder-cell--complete' : ''} ${isTarget ? 'builder-cell--target' : ''} ${showHint ? 'builder-cell--hint' : ''}`}
            >
              <span>
                {index < step
                  ? available.find((token) => token.id === cell.target)?.label ?? '★'
                  : showHint || showPreview
                  ? available.find((token) => token.id === cell.target)?.label ?? '★'
                  : '?'}
              </span>
            </div>
          );
        })}
      </section>

      <section className="builder-palette" aria-label="available shapes">
        {available.map((token) => (
          <button
            key={token.id}
            type="button"
            className="builder-token"
            style={{ background: token.gradient }}
            disabled={lockBoard}
            onClick={() => handleTokenSelect(token.id)}
          >
            <span>{token.label}</span>
          </button>
        ))}
      </section>

      <RewardToast schedule={rewardSchedule} />
    </div>
  );
};
