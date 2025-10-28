import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import './HubCard.css';

type HubCardProps = {
  label: string;
  disabled?: boolean;
  onSelect?: () => void;
};

export const HubCard = ({ label, disabled = false, onSelect }: HubCardProps) => {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);

  const content = (
    <div className="hub-card__content">
      <span aria-hidden>🎮</span>
      <p className="hub-card__label">{label}</p>
      {disabled && <p className="hub-card__note">{t('hub.comingSoon')}</p>}
    </div>
  );

  if (disabled) {
    return (
      <article className="hub-card hub-card--disabled" aria-disabled="true">
        {content}
      </article>
    );
  }

  return (
    <button
      type="button"
      className={`hub-card ${isFocused ? 'hub-card--focused' : ''}`}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      onClick={onSelect}
    >
      {content}
    </button>
  );
};
