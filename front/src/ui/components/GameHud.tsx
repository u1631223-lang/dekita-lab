import { useTranslation } from 'react-i18next';
import { useSessionController } from '@app/session/SessionProvider';
import { SessionTimerBadge } from './SessionTimerBadge';
import './GameHud.css';

export const GameHud = () => {
  const { t } = useTranslation();
  const { currentStats, currentRound } = useSessionController();

  const summary = currentStats && currentRound && currentStats.gameId === currentRound.gameId ? currentStats.summary : null;
  const goalInfo = (() => {
    if (!summary) {
      return { label: t('hud.nextGoal'), remaining: 3, isComplete: false };
    }
    const thresholds = [3, 5, 8, 12, 16];
    const currentBest = summary.bestStreak;
    const target = thresholds.find((value) => value > currentBest) ?? currentBest + 2;
    const remaining = target - currentBest;
    if (remaining <= 0) {
      return { label: t('hud.goalAchieved'), remaining: 0, isComplete: true };
    }
    return { label: t('hud.nextGoal'), remaining, isComplete: false };
  })();

  return (
    <section className="game-hud" aria-live="polite">
      <div className="game-hud__metric">
        <span>{t('hud.success', 'せいこうりつ')}</span>
        <strong>{summary ? `${Math.round(summary.successRate * 100)}%` : '—'}</strong>
      </div>
      <div className="game-hud__metric">
        <span>{t('hud.streak', 'れんしょう')}</span>
        <strong>{summary?.bestStreak ?? 0}</strong>
      </div>
      <div className="game-hud__metric">
        <span>{t('hud.reaction', 'へんとうじかん')}</span>
        <strong>{summary ? `${Math.round(summary.reactionTrendMs)}ms` : '—'}</strong>
      </div>
      <div className={`game-hud__metric ${goalInfo.isComplete ? 'game-hud__metric--complete' : ''}`}>
        <span>{goalInfo.label}</span>
        <strong>{goalInfo.isComplete ? '★' : `あと ${goalInfo.remaining}`}</strong>
      </div>
      <SessionTimerBadge />
    </section>
  );
};
