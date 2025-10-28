import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GameHud } from '@ui/components/GameHud';
import { useSessionController } from '@app/session/SessionProvider';
import {
  SHICHI_NARABE_SUIT_SYMBOL,
  SHICHI_NARABE_SUITS,
  ShichiNarabeCard,
  ShichiNarabeRoundState,
  ShichiNarabeSuit
} from './types';
import { canPlayCard, getPlayableCards, playCardOnField } from './logic';
import './ShichiNarabeScreen.css';

type ParticipantStatus = 'playing' | 'finished' | 'out';

interface Participant {
  id: string;
  displayNameKey: string;
  isHuman: boolean;
  hand: ShichiNarabeCard[];
  passesUsed: number;
  status: ParticipantStatus;
}

type Phase = 'idle' | 'player' | 'opponent' | 'finished';

type FieldState = ShichiNarabeRoundState['field'];

const countActiveParticipants = (participants: Participant[]) =>
  participants.filter((participant) => participant.status === 'playing').length;

const findNextActiveIndex = (participants: Participant[], fromIndex: number): number => {
  if (participants.length === 0) {
    return 0;
  }
  const total = participants.length;
  for (let offset = 1; offset <= total; offset += 1) {
    const next = (fromIndex + offset) % total;
    if (participants[next]?.status === 'playing') {
      return next;
    }
  }
  return fromIndex;
};

const createEmptyField = (): FieldState =>
  SHICHI_NARABE_SUITS.reduce(
    (acc, suit) => ({
      ...acc,
      [suit]: {
        lowest: 7,
        highest: 7,
        cards: []
      }
    }),
    {} as FieldState
  );

const createParticipantsFromState = (state: ShichiNarabeRoundState | null): Participant[] => {
  if (!state) {
    return [];
  }
  const player: Participant = {
    id: 'player',
    displayNameKey: 'shichiNarabe.player.you',
    isHuman: true,
    hand: [...state.playerHand],
    passesUsed: 0,
    status: state.playerHand.length === 0 ? 'finished' : 'playing'
  };

  const opponents: Participant[] = state.opponents.map((opponent) => ({
    id: opponent.id,
    displayNameKey: opponent.displayNameKey,
    isHuman: false,
    hand: [...opponent.cards],
    passesUsed: opponent.passesUsed,
    status: opponent.cards.length === 0 ? 'finished' : 'playing'
  }));

  return [player, ...opponents];
};

const suitLabelKey: Record<ShichiNarabeSuit, string> = {
  spade: 'shichiNarabe.suits.spade',
  heart: 'shichiNarabe.suits.heart',
  diamond: 'shichiNarabe.suits.diamond',
  club: 'shichiNarabe.suits.club'
};

export const ShichiNarabeScreen = () => {
  const { currentRound, roundState, recordRound, endSession } = useSessionController();
  const { t } = useTranslation();
  const initialState = (roundState as ShichiNarabeRoundState | null) ?? null;

  const [field, setField] = useState<FieldState>(initialState?.field ?? createEmptyField());
  const [participants, setParticipants] = useState<Participant[]>(createParticipantsFromState(initialState));
  const [phase, setPhase] = useState<Phase>('idle');
  const [turnIndex, setTurnIndex] = useState(0);
  const [consecutivePasses, setConsecutivePasses] = useState(0);
  const [hintCardId, setHintCardId] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [hasFinished, setHasFinished] = useState(false);

  const reactionRef = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const hintTimerRef = useRef<number>();
  const autoHintTimerRef = useRef<number>();
  const opponentTimerRef = useRef<number>();

  const config = initialState?.config ?? null;
  const passLimit = config?.passLimit ?? Infinity;

  const player = participants[0] ?? null;

  const playableCardIds = useMemo(() => {
    if (!player || !field || phase !== 'player') {
      return new Set<string>();
    }
    return new Set(getPlayableCards(player.hand, field).map((card) => card.id));
  }, [player, field, phase]);

  const passesRemaining = useMemo(() => {
    if (!player) {
      return 0;
    }
    if (passLimit === Infinity) {
      return Number.POSITIVE_INFINITY;
    }
    return Math.max(0, passLimit - player.passesUsed);
  }, [player, passLimit]);

  const cleanupTimers = useCallback(() => {
    if (hintTimerRef.current) {
      window.clearTimeout(hintTimerRef.current);
      hintTimerRef.current = undefined;
    }
    if (autoHintTimerRef.current) {
      window.clearTimeout(autoHintTimerRef.current);
      autoHintTimerRef.current = undefined;
    }
    if (opponentTimerRef.current) {
      window.clearTimeout(opponentTimerRef.current);
      opponentTimerRef.current = undefined;
    }
  }, []);

  const completeRound = useCallback(
    (success: boolean) => {
      if (!currentRound || hasFinished) {
        return;
      }
      cleanupTimers();
      setHasFinished(true);
      setPhase('finished');
      const endedAt = typeof performance !== 'undefined' ? performance.now() : 0;
      recordRound({
        success,
        reactionTimeMs: Math.max(0, endedAt - reactionRef.current),
        hintsUsed,
        endedAt
      });
      setMessage(
        success
          ? t('shichiNarabe.victory', 'ぜんぶ ならべた！')
          : t('shichiNarabe.defeat', 'ざんねん！また ちょうせんしてみよう')
      );
    },
    [cleanupTimers, currentRound, hasFinished, hintsUsed, recordRound, t]
  );

  const evaluateNextStep = useCallback(
    (
      snapshot: Participant[],
      nextField: FieldState,
      actorIndex: number,
      action: 'play' | 'pass',
      previousConsecutive: number
    ) => {
      const human = snapshot[0];
      const nextConsecutive = action === 'pass' ? previousConsecutive + 1 : 0;
      const activeCount = countActiveParticipants(snapshot);

      setField(nextField);

      if (!human) {
        setConsecutivePasses(nextConsecutive);
        return;
      }

      if (human.status === 'finished') {
        setConsecutivePasses(nextConsecutive);
        completeRound(true);
        return;
      }

      if (human.status === 'out') {
        setConsecutivePasses(nextConsecutive);
        completeRound(false);
        return;
      }

      if (activeCount === 0) {
        setConsecutivePasses(nextConsecutive);
        completeRound(human.hand.length === 0);
        return;
      }

      if (nextConsecutive >= activeCount && activeCount > 0) {
        setConsecutivePasses(nextConsecutive);
        completeRound(human.hand.length === 0);
        return;
      }

      const nextIndex = findNextActiveIndex(snapshot, actorIndex);
      setConsecutivePasses(nextConsecutive);
      setTurnIndex(nextIndex);

      const nextParticipant = snapshot[nextIndex];
      if (nextParticipant) {
        const nextPhase: Phase = nextParticipant.isHuman ? 'player' : 'opponent';
        setPhase(nextPhase);
        setMessage(
          nextParticipant.isHuman
            ? t('shichiNarabe.turnPlayer', 'あなたのばんだよ')
            : t('shichiNarabe.turnAi', {
                name: t(nextParticipant.displayNameKey, nextParticipant.displayNameKey)
              })
        );
      } else {
        setPhase('finished');
      }
    },
    [completeRound, t]
  );

  const handleHint = useCallback(
    (fromAuto = false) => {
      if (!player || !field) {
        return;
      }
      const playable = getPlayableCards(player.hand, field);
      if (playable.length === 0) {
        setMessage(t('shichiNarabe.noMoves', 'ならべられるカードが ないよ'));
        return;
      }
      if (!fromAuto) {
        setHintsUsed((prev) => prev + 1);
      }
      const [choice] = playable;
      setHintCardId(choice.id);
      if (hintTimerRef.current) {
        window.clearTimeout(hintTimerRef.current);
      }
      hintTimerRef.current = window.setTimeout(() => {
        setHintCardId(null);
      }, 1500);
    },
    [field, player, t]
  );

  const handlePlayCard = useCallback(
    (card: ShichiNarabeCard) => {
      if (phase !== 'player' || hasFinished || !player || !field) {
        return;
      }
      if (!canPlayCard(card, field)) {
        setMessage(t('shichiNarabe.needAdjacent', '7の となりに ならべてね'));
        return;
      }

      const nextParticipants = participants.map((participant, index) => {
        if (index !== 0) {
          return participant;
        }
        const nextHand = participant.hand.filter((item) => item.id !== card.id);
        return {
          ...participant,
          hand: nextHand,
          status: nextHand.length === 0 ? 'finished' : participant.status
        };
      });

      const nextField = playCardOnField(field, card);
      setParticipants(nextParticipants);
      if (hintTimerRef.current) {
        window.clearTimeout(hintTimerRef.current);
        hintTimerRef.current = undefined;
      }
      setHintCardId(null);
      setMessage(
        t('shichiNarabe.played', {
          name: t(player.displayNameKey, player.displayNameKey),
          card: card.label,
          suit: SHICHI_NARABE_SUIT_SYMBOL[card.suit]
        })
      );

      evaluateNextStep(nextParticipants, nextField, 0, 'play', consecutivePasses);
    },
    [consecutivePasses, evaluateNextStep, field, hasFinished, participants, phase, player, t]
  );

  const handlePass = useCallback(() => {
    if (phase !== 'player' || hasFinished || !player) {
      return;
    }
    if (player.status !== 'playing') {
      return;
    }
    if (player.passesUsed >= passLimit) {
      setMessage(t('shichiNarabe.passLimit', 'もう パスできないよ'));
      return;
    }

    const nextParticipants = participants.map((participant, index) => {
      if (index !== 0) {
        return participant;
      }
      const nextPasses = participant.passesUsed + 1;
      return {
        ...participant,
        passesUsed: nextPasses,
        status: nextPasses >= passLimit ? 'out' : participant.status
      };
    });

    setParticipants(nextParticipants);
    setMessage(
      t('shichiNarabe.passAnnouncement', {
        name: t(player.displayNameKey, player.displayNameKey),
        remaining: Math.max(0, passLimit - (player.passesUsed + 1))
      })
    );

    evaluateNextStep(nextParticipants, field, 0, 'pass', consecutivePasses);
  }, [consecutivePasses, evaluateNextStep, field, hasFinished, passLimit, participants, phase, player, t]);

  useEffect(() => {
    if (!initialState || !currentRound) {
      return;
    }

    cleanupTimers();

    const snapshot = createParticipantsFromState(initialState);
    const nextField = initialState.field ?? createEmptyField();
    const initialIndex = snapshot[0]?.status === 'playing' ? 0 : findNextActiveIndex(snapshot, 0);
    const initialPhase: Phase = snapshot[initialIndex]?.isHuman ? 'player' : 'opponent';

    setParticipants(snapshot);
    setField(nextField);
    setPhase(initialPhase);
    setTurnIndex(initialIndex);
    setConsecutivePasses(0);
    setHintCardId(null);
    setHintsUsed(0);
    setHasFinished(false);
    reactionRef.current = typeof performance !== 'undefined' ? performance.now() : 0;
    setMessage(t('shichiNarabe.goal', '7を つなげよう！'));
  }, [cleanupTimers, currentRound, initialState, t]);

  useEffect(() => cleanupTimers, [cleanupTimers]);

  useEffect(() => {
    if (phase !== 'player' || hasFinished || !config?.autoHintOnStall) {
      return undefined;
    }
    if (autoHintTimerRef.current) {
      window.clearTimeout(autoHintTimerRef.current);
    }
    autoHintTimerRef.current = window.setTimeout(() => {
      handleHint(true);
    }, config.hintDelayMs);
    return () => {
      if (autoHintTimerRef.current) {
        window.clearTimeout(autoHintTimerRef.current);
        autoHintTimerRef.current = undefined;
      }
    };
  }, [config, handleHint, hasFinished, phase, turnIndex]);

  useEffect(() => {
    if (phase !== 'opponent' || hasFinished) {
      return undefined;
    }
    const opponent = participants[turnIndex];
    if (!opponent || opponent.isHuman || opponent.status !== 'playing' || !field) {
      return undefined;
    }
    if (opponentTimerRef.current) {
      window.clearTimeout(opponentTimerRef.current);
    }
    const delay = Math.max(650, (config?.hintDelayMs ?? 1000) - 200);
    opponentTimerRef.current = window.setTimeout(() => {
      const snapshot = participants;
      const currentOpponent = snapshot[turnIndex];
      if (!currentOpponent || currentOpponent.isHuman || currentOpponent.status !== 'playing' || !field) {
        return;
      }
      const playable = getPlayableCards(currentOpponent.hand, field);
      if (playable.length > 0) {
        const choice = playable[Math.floor(Math.random() * playable.length)];
        const nextField = playCardOnField(field, choice);
        const nextParticipants = snapshot.map((participant, index) => {
          if (index !== turnIndex) {
            return participant;
          }
          const nextHand = participant.hand.filter((card) => card.id !== choice.id);
          return {
            ...participant,
            hand: nextHand,
            status: nextHand.length === 0 ? 'finished' : participant.status
          };
        });
        setParticipants(nextParticipants);
        setMessage(
          t('shichiNarabe.played', {
            name: t(currentOpponent.displayNameKey, currentOpponent.displayNameKey),
            card: choice.label,
            suit: SHICHI_NARABE_SUIT_SYMBOL[choice.suit]
          })
        );
        evaluateNextStep(nextParticipants, nextField, turnIndex, 'play', consecutivePasses);
      } else {
        const nextParticipants = snapshot.map((participant, index) => {
          if (index !== turnIndex) {
            return participant;
          }
          const nextPasses = participant.passesUsed + 1;
          return {
            ...participant,
            passesUsed: nextPasses,
            status: nextPasses >= passLimit ? 'out' : participant.status
          };
        });
        setParticipants(nextParticipants);
        setMessage(
          t('shichiNarabe.passAnnouncement', {
            name: t(currentOpponent.displayNameKey, currentOpponent.displayNameKey),
            remaining: Math.max(0, passLimit - (currentOpponent.passesUsed + 1))
          })
        );
        evaluateNextStep(nextParticipants, field, turnIndex, 'pass', consecutivePasses);
      }
    }, delay);

    return () => {
      if (opponentTimerRef.current) {
        window.clearTimeout(opponentTimerRef.current);
        opponentTimerRef.current = undefined;
      }
    };
  }, [config, consecutivePasses, evaluateNextStep, field, hasFinished, participants, passLimit, phase, t, turnIndex]);

  if (!initialState) {
    return (
      <div className="shichi-screen">
        <header className="shichi-header">
          <button className="shichi-exit" onClick={endSession}>
            {t('actions.back', 'もどる')}
          </button>
          <h1 className="shichi-title">{t('shichiNarabe.goal', '7を つなげよう！')}</h1>
        </header>
        <p className="shichi-message" role="status">
          {t('shichiNarabe.loading', 'ラウンドを よみこみちゅうです…')}
        </p>
      </div>
    );
  }

  return (
    <div className="shichi-screen">
      <header className="shichi-header">
        <button className="shichi-exit" onClick={endSession}>
          {t('actions.back', 'もどる')}
        </button>
        <div className="shichi-status" role="status" aria-live="polite">
          <p>{t('shichiNarabe.goal', '7を つなげよう！')}</p>
          {passLimit !== Infinity ? (
            <p>
              {t('shichiNarabe.passesLeft', 'のこりパス {{count}} かい', {
                count: passesRemaining
              })}
            </p>
          ) : null}
          <p>
            {t('shichiNarabe.handCount', 'てふだ {{count}} まい', {
              count: player?.hand.length ?? 0
            })}
          </p>
        </div>
        <div className="shichi-actions">
          <button
            type="button"
            className="shichi-action shichi-action--hint"
            onClick={() => handleHint(false)}
            disabled={phase !== 'player' || (player?.hand.length ?? 0) === 0 || playableCardIds.size === 0 || hasFinished}
          >
            {t('shichiNarabe.hint', 'ヒント')}
          </button>
          <button
            type="button"
            className="shichi-action shichi-action--pass"
            onClick={handlePass}
            disabled={phase !== 'player' || hasFinished || passesRemaining === 0}
          >
            {t('shichiNarabe.pass', 'パス')}
          </button>
        </div>
      </header>

      <GameHud />

      <section className="shichi-message" role="status" aria-live="polite">
        {message ?? t('shichiNarabe.turnPlayer', 'あなたのばんだよ')}
      </section>

      <main className="shichi-board">
        <section className="shichi-field" aria-label={t('shichiNarabe.field', 'ばのカード')}>
          {SHICHI_NARABE_SUITS.map((suit) => {
            const lane = field?.[suit];
            return (
              <div key={suit} className={`shichi-lane shichi-lane--${suit}`}>
                <header className="shichi-lane__title">
                  {t(suitLabelKey[suit], SHICHI_NARABE_SUIT_SYMBOL[suit])}
                </header>
                <div className="shichi-lane__cards">
                  {lane?.cards.map((card) => (
                    <div key={card.id} className="shichi-card shichi-card--field" aria-hidden="true">
                      <span className="shichi-card__suit">{SHICHI_NARABE_SUIT_SYMBOL[card.suit]}</span>
                      <span className="shichi-card__rank">{card.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <aside className="shichi-opponents" aria-label={t('shichiNarabe.opponents', 'あいてのじょうほう')}>
          {participants.slice(1).map((opponent) => (
            <article
              key={opponent.id}
              className={`shichi-opponent ${opponent.status !== 'playing' ? 'is-inactive' : ''}`}
            >
              <h3 className="shichi-opponent__name">{t(opponent.displayNameKey, opponent.displayNameKey)}</h3>
              <p className="shichi-opponent__hand">
                {t('shichiNarabe.handCount', 'てふだ {{count}} まい', {
                  count: opponent.hand.length
                })}
              </p>
              <p className="shichi-opponent__passes">
                {t('shichiNarabe.passesUsed', 'パス {{count}} かい', {
                  count: opponent.passesUsed
                })}
              </p>
              {opponent.status === 'finished' ? (
                <p className="shichi-opponent__status">{t('shichiNarabe.finished', 'あがったよ！')}</p>
              ) : null}
              {opponent.status === 'out' ? (
                <p className="shichi-opponent__status">{t('shichiNarabe.out', 'パスが いっぱい')}</p>
              ) : null}
            </article>
          ))}
        </aside>
      </main>

      <section className="shichi-hand" aria-label={t('shichiNarabe.yourHand', 'あなたの てふだ')}>
        {player?.hand.length ? (
          player.hand.map((card) => {
            const isPlayable = playableCardIds.has(card.id);
            const isHinted = hintCardId === card.id;
            return (
              <button
                key={card.id}
                type="button"
                className={`shichi-card shichi-card--hand ${isPlayable ? 'is-playable' : ''} ${isHinted ? 'is-hinted' : ''}`}
                onClick={() => handlePlayCard(card)}
                disabled={phase !== 'player' || hasFinished}
                aria-label={t('shichiNarabe.cardLabel', '{{suit}}{{rank}}', {
                  suit: SHICHI_NARABE_SUIT_SYMBOL[card.suit],
                  rank: card.label
                })}
              >
                <span className="shichi-card__suit">{SHICHI_NARABE_SUIT_SYMBOL[card.suit]}</span>
                <span className="shichi-card__rank">{card.label}</span>
              </button>
            );
          })
        ) : (
          <p className="shichi-hand__empty">{t('shichiNarabe.emptyHand', 'カードは もう ないよ！')}</p>
        )}
      </section>
    </div>
  );
};
