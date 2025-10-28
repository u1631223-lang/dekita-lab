import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionController } from '@app/session/SessionProvider';
import { RewardToast } from '@ui/components/RewardToast';
import { GameHud } from '@ui/components/GameHud';
import { useAudioCue } from '@ui/hooks/useAudioCue';
import { SequenceSparkRoundState, SparkPad } from './types';
import './SequenceSparkScreen.css';

export const SequenceSparkScreen = () => {
  const { currentRound, recordRound, lastRecommendation, rewardSchedule, endSession, roundState, currentStats } =
    useSessionController();
  const { t } = useTranslation();
  const { play } = useAudioCue();
  const sparkState = (roundState as SequenceSparkRoundState | null) ?? null;
  const pads = sparkState?.pads ?? [];
  const sequence = sparkState?.sequence ?? [];
  const [input, setInput] = useState<string[]>([]);
  const [inputFeedback, setInputFeedback] = useState<('correct' | 'incorrect')[]>([]);
  const [activePad, setActivePad] = useState<string | null>(null);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'miss' | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const timersRef = useRef<number[]>([]);
  const reactionRef = useRef(performance.now());
  const totalRounds = currentStats && currentRound && currentStats.gameId === currentRound.gameId ? currentStats.summary.totalRounds : 0;
  const masteryPhase = Math.min(3, Math.floor(totalRounds / 3));

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => clearTimers, []);

  const playSequence = (padsList: SparkPad[]) => {
    if (!sparkState) {
      return;
    }
    clearTimers();
    const baseInterval = sparkState.config.playbackIntervalMs;
    const baseFlash = sparkState.config.flashDurationMs;
    const speedMultiplier = [1.4, 1.1, 0.9, 0.75][masteryPhase];
    const interval = baseInterval * speedMultiplier;
    const flashDuration = baseFlash * speedMultiplier * 0.8;
    setIsPlayingBack(true);
    sequence.forEach((padId, index) => {
      const delay = interval * index;
      const startId = window.setTimeout(() => {
        const pad = padsList.find((item) => item.id === padId);
        if (pad) {
          play(pad.id);
        }
        setActivePad(padId);
      }, delay);
      timersRef.current.push(startId);
      const endId = window.setTimeout(() => {
        setActivePad(null);
        if (index === sequence.length - 1) {
          setIsPlayingBack(false);
          reactionRef.current = performance.now();
        }
      }, delay + flashDuration);
      timersRef.current.push(endId);
    });
  };

  useEffect(() => {
    if (!sparkState || !currentRound) {
      return;
    }
    setInput([]);
    setInputFeedback([]);
    setFeedback(null);
    const needsHint = lastRecommendation?.provideHint ?? false;
    setHintsUsed(needsHint ? 1 : 0);
    playSequence(pads);
  }, [currentRound?.roundId, sparkState, lastRecommendation?.provideHint]);

const completeRound = (success: boolean) => {
  if (!currentRound) {
    return;
  }
  setIsPlayingBack(true);
  setFeedback(success ? 'success' : 'miss');
  recordRound({
    success,
    reactionTimeMs: Math.max(0, performance.now() - reactionRef.current),
      hintsUsed,
      endedAt: performance.now()
    });
  };

  const handlePadPress = (padId: string) => {
    if (isPlayingBack || !sparkState) {
      return;
    }
    play(padId);
    const nextInput = [...input, padId];
    setInput(nextInput);
    const expected = sequence[nextInput.length - 1];
  if (expected !== padId) {
    setInputFeedback((prev) => [...prev, 'incorrect']);
    completeRound(false);
    return;
  }

  setInputFeedback((prev) => [...prev, 'correct']);

  if (nextInput.length === sequence.length) {
    completeRound(true);
  }
};

  const handleHint = () => {
    if (!sparkState || isPlayingBack) {
      return;
    }
    setHintsUsed((prev) => prev + 1);
    playSequence(pads);
  };

  return (
    <div className="spark-screen">
      <header className="spark-header">
        <button className="spark-exit" onClick={endSession}>
          {t('actions.back', 'もどる')}
        </button>
        <div className="spark-status">
          <span>{isPlayingBack ? t('sequence.listen', 'ひかりを みてね') : t('sequence.replay', 'おぼえた とおりに タッチ！')}</span>
          {feedback === 'success' && <span className="spark-feedback spark-feedback--success">{t('reward.goodJob')}</span>}
          {feedback === 'miss' && <span className="spark-feedback spark-feedback--miss">{t('sequence.tryAgain', 'もう いちど！')}</span>}
        </div>
        <button className="spark-hint" onClick={handleHint} disabled={isPlayingBack}>
          {t('rhythm.hint', 'ヒント')}×{hintsUsed}
        </button>
      </header>

      <div className="sequence-feedback-container">
        {Array.from({ length: sequence.length }).map((_, i) => {
          const status = inputFeedback[i];
          return (
            <div key={i} className={`feedback-dot ${status ? `feedback-dot--${status}` : ''}`}>
              {status === 'correct' && '✓'}
              {status === 'incorrect' && '✗'}
            </div>
          );
        })}
      </div>

      <GameHud />

      <section className="spark-grid">
        {pads.map((pad) => (
          <button
            key={pad.id}
            type="button"
            className={`spark-pad ${activePad === pad.id ? 'spark-pad--active' : ''}`}
            style={{ background: pad.gradient }}
            disabled={isPlayingBack}
            onClick={() => handlePadPress(pad.id)}
          >
            <span>{pad.label}</span>
          </button>
        ))}
      </section>

      <RewardToast schedule={rewardSchedule} />
      {feedback === 'success' && (
        <div className="spark-stage-banner" aria-live="polite">
          {t('sequence.stageClear', 'できた！つぎの レベルへ')}
        </div>
      )}
    </div>
  );
};
