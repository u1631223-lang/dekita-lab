import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProgressStore } from '@core/state';
import './CelebrationOverlay.css';

export const CelebrationOverlay = () => {
  const { t } = useTranslation();
  const lastMilestone = useProgressStore((state) => state.lastMilestone);
  const stars = useProgressStore((state) => state.stars);
  const { clearMilestone } = useProgressStore((state) => state.actions);

  useEffect(() => {
    if (!lastMilestone) {
      return;
    }
    const timer = window.setTimeout(() => clearMilestone(), 2500);
    return () => window.clearTimeout(timer);
  }, [lastMilestone, clearMilestone]);

  if (!lastMilestone) {
    return null;
  }

  return (
    <div className="celebration-overlay" aria-live="assertive">
      <div className="celebration-card">
        <span className="celebration-icon">🌟</span>
        <p>{t('celebration.milestone', { defaultValue: '{{value}}こ の スターを あつめたよ！', value: lastMilestone })}</p>
        <p className="celebration-total">{t('celebration.total', { defaultValue: 'ぜんぶで {{stars}}こ', stars })}</p>
      </div>
    </div>
  );
};
