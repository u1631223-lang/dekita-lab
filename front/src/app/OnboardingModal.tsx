import { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useProgressStore } from '@core/state';
import { useRewardSettingsStore } from '@core/rewards';
import './OnboardingModal.css';

type OnboardingModalProps = {
  open: boolean;
  onClose: () => void;
  onReset: () => void;
};

export const OnboardingModal = ({ open, onClose, onReset }: OnboardingModalProps) => {
  const { t } = useTranslation();
  const { completeOnboarding } = useProgressStore((state) => state.actions);
  const rewardSettings = useRewardSettingsStore((state) => ({
    volume: state.volume,
    muted: state.muted,
    allowCelebration: state.allowCelebration,
    actions: state.actions
  }));

  if (!open) {
    return null;
  }

  const handleVolumeChange = (event: FormEvent<HTMLInputElement>) => {
    rewardSettings.actions.setVolume(Number(event.currentTarget.value) / 100);
  };

  const handleClose = () => {
    completeOnboarding();
    onClose();
  };

  return (
    <div className="onboarding-backdrop" role="dialog" aria-modal="true">
      <div className="onboarding-card">
        <header className="onboarding-card__header">
          <h2>{t('onboarding.title')}</h2>
          <p>{t('onboarding.description')}</p>
          <small>{t('onboarding.caregiverNote')}</small>
        </header>
        <section className="onboarding-card__settings">
          <h3>{t('onboarding.rewards.title')}</h3>
          <label className="onboarding-setting">
            <span>{t('onboarding.rewards.volume')}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(rewardSettings.volume * 100)}
              onInput={handleVolumeChange}
            />
            <span className="onboarding-setting__value">{Math.round(rewardSettings.volume * 100)}%</span>
          </label>
          <div className="onboarding-setting onboarding-setting--toggle">
            <label>
              <input
                type="checkbox"
                checked={!rewardSettings.muted}
                onChange={(event) => rewardSettings.actions.setMuted(!event.target.checked)}
              />
              {t('onboarding.rewards.sound')}
            </label>
            <label>
              <input
                type="checkbox"
                checked={rewardSettings.allowCelebration}
                onChange={(event) => rewardSettings.actions.setAllowCelebration(event.target.checked)}
              />
              {t('onboarding.rewards.celebration')}
            </label>
          </div>
        </section>
        <footer className="onboarding-card__footer">
          <button type="button" onClick={handleClose}>
            {t('onboarding.finish')}
          </button>
          <button
            type="button"
            className="onboarding-reset"
            onClick={() => {
              onReset();
              handleClose();
            }}
          >
            {t('onboarding.reset')}
          </button>
        </footer>
      </div>
    </div>
  );
};
