import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionController } from '@app/session/SessionProvider';
import { useAudioCue } from '@ui/hooks/useAudioCue';
import { RewardToast } from '@ui/components/RewardToast';
import { GameHud } from '@ui/components/GameHud';
import { RhythmStimulus } from './types';
import { RhythmRoundState } from './module';
import './RhythmTapScreen.css';

export const RhythmTapScreen = () => {
  const { currentRound, recordRound, lastRecommendation, rewardSchedule, endSession, roundState, currentStats } =
    useSessionController();
  const { play } = useAudioCue();
  const { t } = useTranslation();
  const rhythmState = (roundState as RhythmRoundState | null) ?? null;
  const pattern = rhythmState?.pattern ?? [];
  const availableStimuli = rhythmState?.stimuliPool ?? [];
  const [input, setInput] = useState<RhythmStimulus[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'miss' | null>(null);
  const [hintReplays, setHintReplays] = useState(0);
  const reactionRef = useRef(performance.now());
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const playPattern = (sequence: RhythmStimulus[], tempoMs: number, initialDelayMs: number) => {
    clearTimers();
    setIsPlayingBack(true);
    let scheduleMs = initialDelayMs;
    sequence.forEach((beat, index) => {
      const startId = window.setTimeout(() => {
        setActiveIndex(index);
        play(beat.audio);
      }, scheduleMs);
      timersRef.current.push(startId);

      const endId = window.setTimeout(() => {
        setActiveIndex(null);
        if (index === sequence.length - 1) {
          setIsPlayingBack(false);
          reactionRef.current = performance.now();
        }
      }, scheduleMs + tempoMs * 0.6);
      timersRef.current.push(endId);
      scheduleMs += tempoMs;
    });
  };

  useEffect(() => clearTimers, []);

  useEffect(() => {
    if (!currentRound || !rhythmState) {
      return;
    }
    setInput([]);
    setFeedback(null);
    const needsHint = lastRecommendation?.provideHint ?? false;

    const totalRounds = currentStats && currentRound && currentStats.gameId === currentRound.gameId
      ? currentStats.summary.totalRounds
      : 0;
    const masteryPhase = Math.min(3, Math.floor(totalRounds / 3));
    const tempoMultipliers = [1.6, 1.2, 0.95, 0.75];
    const delayMultipliers = [2.0, 1.4, 1.0, 0.85];
    const phaseTempo = tempoMultipliers[masteryPhase];
    const phaseDelay = delayMultipliers[masteryPhase];

    setHintReplays(needsHint ? 1 : 0);
    const config = rhythmState.config;
    const tempo = config.tempoMs * (needsHint ? Math.min(phaseTempo * 1.1, 2.5) : phaseTempo);
    const delay = config.playbackDelayMs * (needsHint ? Math.min(phaseDelay * 1.1, 2.6) : phaseDelay);
    playPattern(pattern, tempo, delay);
  }, [currentRound?.roundId, rhythmState, lastRecommendation?.provideHint, currentStats, currentRound]);

  const handleHint = () => {
    if (!currentRound || !rhythmState || isPlayingBack) {
      return;
    }
    const config = rhythmState.config;
    const tempo = config.tempoMs * 1.25;
    const delay = config.playbackDelayMs * 1.4;
    setHintReplays((prev) => prev + 1);
    playPattern(pattern, tempo, delay);
  };

  const completeRound = (success: boolean) => {
    if (!currentRound) {
      return;
    }
    setIsPlayingBack(true);
    setFeedback(success ? 'success' : 'miss');
    recordRound({
      success,
      reactionTimeMs: Math.max(0, performance.now() - reactionRef.current),
      hintsUsed: hintReplays,
      endedAt: performance.now()
    });
  };

  const handleInput = (stimulus: RhythmStimulus) => {
    if (isPlayingBack || !currentRound) {
      return;
    }
    play(stimulus.audio);
    const nextIndex = input.length;
    const expected = pattern[nextIndex];
    const nextInput = [...input, stimulus];
    setInput(nextInput);

    if (!expected || expected.id !== stimulus.id) {
      completeRound(false);
      return;
    }

    if (nextInput.length === pattern.length) {
      completeRound(true);
    }
  };

  return (
    <div className="rhythm-screen">
      <header className="rhythm-header">
        <button className="rhythm-exit" onClick={endSession}>
          {t('actions.back', 'もどる')}
        </button>
        <div className="rhythm-status">
          <span>{isPlayingBack ? t('rhythm.listen', 'リズムをきこう') : t('rhythm.tap', 'まねしてタップ！')}</span>
          {feedback === 'success' && <span className="rhythm-feedback rhythm-feedback--success">{t('reward.goodJob')}</span>}
          {feedback === 'miss' && <span className="rhythm-feedback rhythm-feedback--miss">{t('rhythm.tryAgain', 'もういっかい！')}</span>}
        </div>
        <button className="rhythm-hint" onClick={handleHint} disabled={isPlayingBack}>
          {t('rhythm.hint', 'ヒント')}×{hintReplays}
        </button>
      </header>

      <GameHud />

      <div className="rhythm-pattern">
        {pattern.map((stimulus, index) => (
          <div
            key={stimulus.id + index}
            className={`rhythm-beat ${index < input.length ? 'rhythm-beat--played' : ''} ${activeIndex === index ? 'rhythm-beat--active' : ''}`}
          >
            {stimulus.glyph}
          </div>
        ))}
      </div>

      <div className="rhythm-buttons">
        {availableStimuli.map((stimulus) => (
          <button
            key={stimulus.id}
            className="rhythm-button"
            onClick={() => handleInput(stimulus)}
            disabled={isPlayingBack}
          >
            <span>{stimulus.glyph}</span>
          </button>
        ))}
      </div>

      <RewardToast schedule={rewardSchedule} />
    </div>
  );
};
