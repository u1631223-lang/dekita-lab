import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionDuration } from '@app/session/useSessionDuration';
import './SessionTimerBadge.css';

const formatTime = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const SessionTimerBadge = () => {
  const { t } = useTranslation();
  const { elapsedMs, reminderActive, dismissReminder } = useSessionDuration();

  useEffect(() => {
    if (!reminderActive) {
      return;
    }
    const timeout = window.setTimeout(() => dismissReminder(), 8000);
    return () => window.clearTimeout(timeout);
  }, [reminderActive, dismissReminder]);

  return (
    <div className={`session-timer ${reminderActive ? 'session-timer--reminder' : ''}`}>
      <div className="session-timer__row">
        <span className="session-timer__label">{t('timer.label', 'プレイじかん')}</span>
        <strong className="session-timer__value">{formatTime(elapsedMs)}</strong>
      </div>
      {reminderActive && <p className="session-timer__reminder">{t('timer.reminder', 'そろそろ おやすみ しようか')}</p>}
    </div>
  );
};
