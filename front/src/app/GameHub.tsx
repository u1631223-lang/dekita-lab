import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HubCard } from '@ui/components/HubCard';
import { HubLayout } from '@ui/components/HubLayout';
import { useSessionController } from './session/SessionProvider';
import { useProgressStore } from '@core/state';
import { OnboardingModal } from './OnboardingModal';
import { CaregiverGateModal } from './CaregiverGateModal';
import { listGameModules } from '@core/engine';
import { WorldProgressPanel } from '@ui/components/WorldProgressPanel';

export const GameHub = () => {
  const { t } = useTranslation();
  const { startGame, adaptiveSnapshot, resetProgress } = useSessionController();
  const onboardingCompleted = useProgressStore((state) => state.profile.onboardingCompleted);
  const [isOnboardingOpen, setOnboardingOpen] = useState(!onboardingCompleted);
  const [isGateOpen, setGateOpen] = useState(false);
  const lastSummary = useProgressStore((state) => state.lastSummary);
  const modules = useMemo(() => listGameModules(), []);

  useEffect(() => {
    if (!onboardingCompleted) {
      setOnboardingOpen(true);
    }
  }, [onboardingCompleted]);

  const difficultyLabel = useMemo(
    () => (difficulty?: string) =>
      t(`hub.difficulty.${difficulty ?? 'lv1'}`, {
        defaultValue: (difficulty ?? 'lv1').toUpperCase()
      }),
    [t]
  );

  const headerActions = (
    <>
      <button type="button" onClick={() => setGateOpen(true)}>
        {t('hub.settingsButton')}
      </button>
    </>
  );

  return (
    <>
      <HubLayout title={t('hub.welcome')} headerActions={headerActions}>
        <WorldProgressPanel />
        {modules.map((module) => (
          <HubCard
            key={module.id}
            label={`${module.icon} ${t(module.titleKey)} (${difficultyLabel(adaptiveSnapshot.difficultyByGame?.[module.id])})`}
            onSelect={() => startGame(module.id)}
          />
        ))}
        {lastSummary ? (
          <article className="hub-card hub-card--summary" aria-live="polite">
            <div className="hub-card__content hub-card__content--summary">
              <span aria-hidden>📊</span>
              <p className="hub-card__label">{t('summary.title')}</p>
              <ul>
                <li>
                  {t('summary.successRate')}: {Math.round(lastSummary.successRate * 100)}%
                </li>
                <li>
                  {t('summary.averageReaction')}: {Math.round(lastSummary.averageReactionTime)}ms
                </li>
                <li>
                  {t('summary.bestStreak')}: {lastSummary.bestStreak}
                </li>
              </ul>
            </div>
          </article>
        ) : null}
        <HubCard label={t('hub.comingSoon')} disabled />
      </HubLayout>
      <CaregiverGateModal
        open={isGateOpen}
        onClose={() => setGateOpen(false)}
        onSuccess={() => {
          setGateOpen(false);
          setOnboardingOpen(true);
        }}
      />
      <OnboardingModal
        open={isOnboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onReset={resetProgress}
      />
    </>
  );
};
