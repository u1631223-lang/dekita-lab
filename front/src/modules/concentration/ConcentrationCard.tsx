import { CardColor } from './types';
import './ConcentrationCard.css';

type ConcentrationCardProps = {
  rank: string;
  suitSymbol: string;
  color: CardColor;
  revealed: boolean;
  matched: boolean;
  disabled: boolean;
  onSelect: () => void;
  ariaLabel: string;
};

export const ConcentrationCard = ({
  rank,
  suitSymbol,
  color,
  revealed,
  matched,
  disabled,
  onSelect,
  ariaLabel
}: ConcentrationCardProps) => {
  const isFaceUp = revealed || matched;
  return (
    <button
      type="button"
      className={`concentration-card concentration-card--${color} ${isFaceUp ? 'concentration-card--face' : ''} ${
        matched ? 'concentration-card--matched' : ''
      }`}
      onClick={onSelect}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {isFaceUp ? (
        <span className="concentration-card__face" aria-hidden>
          <span className="concentration-card__rank">{rank}</span>
          <span className="concentration-card__suit">{suitSymbol}</span>
        </span>
      ) : (
        <span className="concentration-card__back" aria-hidden>
          ★
        </span>
      )}
    </button>
  );
};
