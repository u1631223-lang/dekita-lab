import { useTranslation } from 'react-i18next';
import { useProgressStore } from '@core/state';
import { listGameModules } from '@core/engine';
import './WorldProgressPanel.css';

export const WorldProgressPanel = () => {
  const { t } = useTranslation();
  const stars = useProgressStore((state) => state.stars);
  const milestonesUnlocked = useProgressStore((state) => state.milestonesUnlocked);
  const modules = listGameModules();

  return (
    <section className="world-panel">
      <header>
        <h2>{t('worldProgress.title', 'きょうの ぼうけん')}</h2>
        <p>{t('worldProgress.subtitle', 'スターを あつめて せかいを ひろげよう')}</p>
      </header>
      <div className="world-panel__body">
        <div className="world-panel__stars">
          <span className="world-panel__stars-icon">🌟</span>
          <div>
            <strong>{stars}</strong>
            <p>{t('worldProgress.totalStars', { defaultValue: 'ぜんぶで {{count}} こ', count: stars })}</p>
          </div>
        </div>
        <ul className="world-panel__milestones">
          {[5, 15, 30, 50].map((value) => (
            <li key={value} className={milestonesUnlocked.includes(value) ? 'world-panel__milestone--done' : ''}>
              {value} {t('worldProgress.starUnit', 'スター')}
            </li>
          ))}
        </ul>
        <ul className="world-panel__games">
          {modules.map((module) => (
            <li key={module.id}>
              <span className="world-panel__icon">{module.icon}</span>
              <span>{t(module.titleKey)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
