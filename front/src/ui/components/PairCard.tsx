import './PairCard.css';

type PairCardProps = {
  glyph?: string;
  revealed: boolean;
  matched: boolean;
  onSelect: () => void;
  disabled?: boolean;
};

export const PairCard = ({ glyph, revealed, matched, onSelect, disabled = false }: PairCardProps) => {
  return (
    <button
      type="button"
      className={`pair-card ${revealed || matched ? 'pair-card--revealed' : ''} ${matched ? 'pair-card--matched' : ''}`}
      onClick={onSelect}
      disabled={disabled}
    >
      <span>{revealed || matched ? glyph : '🌟'}</span>
    </button>
  );
};
