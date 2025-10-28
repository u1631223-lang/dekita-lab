import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RewardSchedule } from '@core/rewards';
import { useAudioCue } from '@ui/hooks/useAudioCue';
import './RewardToast.css';

type RewardToastProps = {
  schedule: RewardSchedule | null;
};

export const RewardToast = ({ schedule }: RewardToastProps) => {
  const { t } = useTranslation();
  const { play } = useAudioCue();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!schedule) {
      setVisible(false);
      return;
    }
    setVisible(true);
    play(schedule.event.audio);
    const timeout = window.setTimeout(() => setVisible(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [schedule?.event.id]);

  if (!schedule || !visible) {
    return null;
  }

  return (
    <div className={`reward-toast reward-toast--${schedule.event.intensity}`}>
      {t(schedule.event.narrationKey)}
    </div>
  );
};
