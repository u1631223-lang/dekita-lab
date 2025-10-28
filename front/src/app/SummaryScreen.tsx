import { useTranslation } from 'react-i18next';
import { useSessionController } from './session/SessionProvider';
import './SummaryScreen.css';

export const SummaryScreen = () => {
  const { telemetrySummary, returnToHub } = useSessionController();
  const { t } = useTranslation();

  if (!telemetrySummary) {
    return null;
  }

  return (
    <div className="summary-screen">
      <h2>{t('summary.title', 'きょうの できた！')}</h2>
      <div className="summary-card">
        <div>
          <p>{t('summary.successRate', 'せいこうりつ')}</p>
          <strong>{Math.round(telemetrySummary.successRate * 100)}%</strong>
        </div>
        <div>
          <p>{t('summary.averageReaction', 'へんとうじかん')}</p>
          <strong>{Math.round(telemetrySummary.averageReactionTime)}ms</strong>
        </div>
        <div>
          <p>{t('summary.bestStreak', 'れんしょう')}</p>
          <strong>{telemetrySummary.bestStreak}</strong>
        </div>
      </div>
      <button className="summary-button" onClick={returnToHub}>
        {t('summary.backToHub', 'つぎも がんばる！')}
      </button>
    </div>
  );
};
