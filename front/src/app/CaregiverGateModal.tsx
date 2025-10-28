import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './CaregiverGateModal.css';

type CaregiverGateModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const makeQuestion = () => {
  const a = Math.floor(Math.random() * 4) + 2; // 2-5
  const b = Math.floor(Math.random() * 4) + 2; // 2-5
  return { a, b, answer: a + b };
};

export const CaregiverGateModal = ({ open, onClose, onSuccess }: CaregiverGateModalProps) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(makeQuestion);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setQuestion(makeQuestion());
      setInput('');
      setError(null);
    }
  }, [open]);

  const prompt = useMemo(() => t('caregiverGate.prompt', { a: question.a, b: question.b }), [question, t]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numeric = Number.parseInt(input, 10);
    if (Number.isNaN(numeric) || numeric !== question.answer) {
      setError(t('caregiverGate.error'));
      return;
    }
    onSuccess();
  };

  return (
    <div className="caregiver-gate-backdrop" role="dialog" aria-modal="true">
      <form className="caregiver-gate" onSubmit={handleSubmit}>
        <h2>{t('caregiverGate.title')}</h2>
        <p>{prompt}</p>
        <input
          className="caregiver-gate__input"
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        {error ? <p className="caregiver-gate__error">{error}</p> : null}
        <div className="caregiver-gate__actions">
          <button type="button" className="caregiver-gate__cancel" onClick={onClose}>
            {t('caregiverGate.cancel')}
          </button>
          <button type="submit" className="caregiver-gate__confirm">
            {t('caregiverGate.confirm')}
          </button>
        </div>
      </form>
    </div>
  );
};
