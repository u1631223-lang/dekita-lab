import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionController } from '@app/session/SessionProvider';
import { RewardToast, GameHud } from '@ui/components';
import { useAudioCue } from '@ui/hooks/useAudioCue';
import { OldMaidCard, OldMaidPairRemoval, OldMaidPlayerState, OldMaidRoundState } from './types';
import { countActivePlayers, findJokerHolderId, findNextActiveIndex, stripPairs } from './logic';
import './OldMaidScreen.css';

type Phase = 'idle' | 'player' | 'ai' | 'finished';

type DrawOutcome = {
  drawnCard: OldMaidCard | null;
  removedPairs: OldMaidPairRemoval[];
  snapshot: OldMaidPlayerState[];
};

const chooseAiCardIndex = (target: OldMaidPlayerState, jokerHolderId: string | null, avoidance: number) => {
  if (target.hand.length === 0) {
    return 0;
  }
  let pick = Math.floor(Math.random() * target.hand.length);
  if (jokerHolderId === target.id) {
    const jokerIndex = target.hand.findIndex((card) => card.isJoker);
    if (jokerIndex !== -1) {
      const shouldAvoid = Math.random() < avoidance && target.hand.length > 1;
      pick = shouldAvoid ? (jokerIndex + 1) % target.hand.length : jokerIndex;
    }
  }
  return pick;
};

export const OldMaidScreen = () => {
  const {
    currentRound,
    recordRound,
    roundState,
    lastRecommendation,
    rewardSchedule,
    endSession,
    currentStats
  } = useSessionController();
  const { t } = useTranslation();
  const { play } = useAudioCue();
  const initialState = (roundState as OldMaidRoundState | null) ?? null;

  const [players, setPlayers] = useState<OldMaidPlayerState[]>(initialState?.players ?? []);
  const [turnIndex, setTurnIndex] = useState(initialState?.turnIndex ?? 0);
  const [jokerHolder, setJokerHolder] = useState<string | null>(initialState?.jokerHolderId ?? null);
  const [discardedPairs, setDiscardedPairs] = useState(initialState?.discardedPairs ?? 0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [hintUses, setHintUses] = useState(0);
  const [hintTarget, setHintTarget] = useState<number | null>(null);
  const [recentPair, setRecentPair] = useState<OldMaidCard[] | null>(null);
  const [jokerAlert, setJokerAlert] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasFinished, setHasFinished] = useState(false);
  const [autoHintShown, setAutoHintShown] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const reactionRef = useRef(typeof performance !== 'undefined' ? performance.now() : 0);

  const config = initialState?.config ?? null;

  useEffect(() => {
    if (!initialState || !currentRound) {
      return;
    }
    setPlayers(initialState.players);
    setTurnIndex(initialState.turnIndex);
    setJokerHolder(initialState.jokerHolderId);
    setDiscardedPairs(initialState.discardedPairs);
    setPhase(initialState.players[initialState.turnIndex]?.isHuman ? 'player' : 'ai');
    setHintUses(0);
    setHintTarget(null);
    setRecentPair(null);
    setJokerAlert(false);
    setHasFinished(false);
    setAutoHintShown(false);
    setIsResolving(false);
    setMessage(null);
    reactionRef.current = typeof performance !== 'undefined' ? performance.now() : 0;
  }, [currentRound?.roundId, initialState]);

  const humanPlayer = useMemo(
    () => players.find((player) => player.isHuman) ?? null,
    [players]
  );

  const opponentPlayers = useMemo(
    () => players.filter((player) => !player.isHuman),
    [players]
  );

  const drawTargetIndex = useMemo(() => findNextActiveIndex(players, turnIndex), [players, turnIndex]);
  const drawTarget =
    players.length > 0 && drawTargetIndex !== turnIndex ? players[drawTargetIndex] : null;

  const remainingHints = Math.max(0, (config?.maxHints ?? 0) - hintUses);

  const resolveDraw = (drawerIndex: number, targetIndex: number, cardIndex: number): DrawOutcome => {
    let drawnCard: OldMaidCard | null = null;
    let removedPairs: OldMaidPairRemoval[] = [];
    let snapshot = players;
    setPlayers((prev) => {
      const drawer = prev[drawerIndex];
      const target = prev[targetIndex];
      if (!drawer || !target || !target.hand[cardIndex]) {
        snapshot = prev;
        return prev;
      }
      const card = target.hand[cardIndex];
      drawnCard = card;
      const nextTargetHand = target.hand.filter((_, idx) => idx !== cardIndex);
      const { remaining, removedPairs: pairRemovals } = stripPairs([...drawer.hand, card]);
      removedPairs = pairRemovals;
      const nextPlayers = prev.map((player, idx) => {
        if (idx === targetIndex) {
          return {
            ...player,
            hand: nextTargetHand,
            status: nextTargetHand.length === 0 ? 'finished' : 'playing'
          };
        }
        if (idx === drawerIndex) {
          return {
            ...player,
            hand: remaining,
            status: remaining.length === 0 ? 'finished' : 'playing'
          };
        }
        return player;
      });
      snapshot = nextPlayers;
      return nextPlayers;
    });
    return { drawnCard, removedPairs, snapshot };
  };

  const advanceAfterDraw = (drawerIndex: number, outcome: DrawOutcome) => {
    if (!outcome.drawnCard) {
      setIsResolving(false);
      return;
    }
    setPhase('idle');
    if (outcome.removedPairs.length > 0) {
      setRecentPair(outcome.removedPairs[0].cards);
      setDiscardedPairs((prev) => prev + outcome.removedPairs.length);
      play('old-maid-pair');
    } else {
      setRecentPair(null);
    }

    if (outcome.drawnCard.isJoker) {
      setJokerAlert(true);
      play('old-maid-joker');
      window.setTimeout(() => setJokerAlert(false), 1200);
    } else {
      setJokerAlert(false);
    }

    const nextJokerHolder = findJokerHolderId(outcome.snapshot);
    setJokerHolder(nextJokerHolder);
    const nextTurn = findNextActiveIndex(outcome.snapshot, drawerIndex);
    setTurnIndex(nextTurn);
    setIsResolving(false);
  };

  const handlePlayerDraw = (cardIndex: number) => {
    if (
      phase !== 'player' ||
      !drawTarget ||
      hasFinished ||
      isResolving ||
      cardIndex < 0 ||
      cardIndex >= drawTarget.hand.length
    ) {
      return;
    }
    setIsResolving(true);
    const outcome = resolveDraw(turnIndex, drawTargetIndex, cardIndex);
    advanceAfterDraw(turnIndex, outcome);
  };

  const handleHint = (fromAuto = false) => {
    if (!config || phase !== 'player' || !drawTarget || drawTarget.hand.length === 0) {
      return;
    }
    if (!fromAuto && remainingHints <= 0) {
      return;
    }
    setHintUses((prev) => (fromAuto ? Math.max(prev, 1) : prev + 1));
    const avoidance = fromAuto ? 0 : config.jokerAvoidance;
    let highlightIndex = Math.floor(Math.random() * drawTarget.hand.length);
    if (jokerHolder === drawTarget.id) {
      const jokerIndex = drawTarget.hand.findIndex((card) => card.isJoker);
      if (jokerIndex !== -1) {
        const avoid = Math.random() < avoidance && drawTarget.hand.length > 1;
        highlightIndex = avoid ? (jokerIndex + 1) % drawTarget.hand.length : jokerIndex;
      }
    }
    setHintTarget(highlightIndex);
    const revealMs = config.revealHintMs > 0 ? config.revealHintMs : 1000;
    window.setTimeout(() => setHintTarget(null), revealMs);
  };

  useEffect(() => {
    if (
      phase === 'player' &&
      (lastRecommendation?.provideHint ?? false) &&
      !autoHintShown &&
      drawTarget &&
      drawTarget.hand.length > 0
    ) {
      handleHint(true);
      setAutoHintShown(true);
    }
  }, [phase, lastRecommendation?.provideHint, autoHintShown, drawTarget]);

  useEffect(() => {
    if (phase !== 'ai' || hasFinished) {
      return;
    }
    const current = players[turnIndex];
    if (!current || current.isHuman) {
      return;
    }
    const targetIndex = findNextActiveIndex(players, turnIndex);
    const target = players[targetIndex];
    if (!target || target.hand.length === 0 || targetIndex === turnIndex) {
      const next = findNextActiveIndex(players, turnIndex);
      if (next !== turnIndex) {
        setTurnIndex(next);
      }
      return;
    }
    setIsResolving(true);
    const timer = window.setTimeout(() => {
      const choice = chooseAiCardIndex(target, jokerHolder, config?.jokerAvoidance ?? 0.5);
      const outcome = resolveDraw(turnIndex, targetIndex, choice);
      advanceAfterDraw(turnIndex, outcome);
    }, config?.aiDelayMs ?? 900);
    return () => window.clearTimeout(timer);
  }, [phase, players, turnIndex, jokerHolder, config, hasFinished]);

  useEffect(() => {
    if (hasFinished || !currentRound) {
      return;
    }
    if (players.length === 0) {
      return;
    }
    const active = countActivePlayers(players);
    if (active <= 1) {
      const endTime = typeof performance !== 'undefined' ? performance.now() : 0;
      const human = players.find((player) => player.isHuman);
      const success = !human || human.hand.length === 0;
      setPhase('finished');
      setHasFinished(true);
      setMessage(success ? t('oldMaid.victory', 'ばっちり！') : t('oldMaid.defeat', 'ババが のこっちゃった…'));
      recordRound({
        success,
        reactionTimeMs: Math.max(0, endTime - reactionRef.current),
        hintsUsed: hintUses,
        endedAt: endTime
      });
    }
  }, [players, hasFinished, currentRound, recordRound, hintUses, t]);

  useEffect(() => {
    if (hasFinished) {
      return;
    }
    if (players.length === 0) {
      return;
    }
    const current = players[turnIndex];
    if (!current || current.hand.length === 0) {
      const next = findNextActiveIndex(players, turnIndex);
      if (next !== turnIndex) {
        setTurnIndex(next);
      }
      return;
    }
    if (phase === 'idle') {
      if (current.isHuman) {
        const totalRounds =
          currentRound && currentStats && currentStats.gameId === currentRound.gameId
            ? currentStats.summary.totalRounds
            : 0;
        const encouragement =
          totalRounds > 0 ? t('oldMaid.encore', 'きょうも じょうずに やってみよう！') : t('oldMaid.goal', 'ババを だれかに わたそう！');
        setMessage(encouragement);
      } else {
        setMessage(t('oldMaid.turn', { name: t(current.displayNameKey, current.displayNameKey) }));
      }
      setPhase(current.isHuman ? 'player' : 'ai');
    }
  }, [phase, players, turnIndex, hasFinished, t, currentRound, currentStats]);

  const renderOpponent = (player: OldMaidPlayerState) => {
    const isActive = players[turnIndex]?.id === player.id && phase !== 'finished';
    const holdingJoker = jokerHolder === player.id;
    return (
      <div
        key={player.id}
        className={`old-maid-opponent ${isActive ? 'is-active' : ''} ${holdingJoker ? 'has-joker' : ''} ${
          player.status === 'finished' ? 'is-finished' : ''
        }`}
      >
        <div className="old-maid-opponent-header">
          <span className="old-maid-opponent-name">{t(player.displayNameKey, player.displayNameKey)}</span>
          <span className="old-maid-opponent-count">{player.hand.length}</span>
        </div>
        <div className="old-maid-opponent-hand">
          {player.hand.map((card) => (
            <div key={card.id} className="old-maid-card-back" aria-hidden="true" />
          ))}
        </div>
      </div>
    );
  };

  const renderPlayerCard = (card: OldMaidCard) => {
    const isPair = recentPair?.some((target) => target.id === card.id);
    const isRed = card.suit === '♥' || card.suit === '♦';
    return (
      <div
        key={card.id}
        className={`old-maid-hand-card ${isPair ? 'is-paired' : ''} ${card.isJoker && jokerAlert ? 'is-joker' : ''} ${
          isRed ? 'is-red' : ''
        }`}
      >
        <span className="old-maid-card-rank">{card.rank}</span>
        <span className="old-maid-card-suit">{card.suit}</span>
      </div>
    );
  };

  const renderTargetArea = () => {
    if (!drawTarget || drawTarget.status === 'finished') {
      return (
        <div className="old-maid-target empty">
          <p>{t('oldMaid.waiting', 'つぎの あいてを まっているよ…')}</p>
        </div>
      );
    }
    const isJokerOwner = jokerHolder === drawTarget.id;
    return (
      <div className={`old-maid-target ${isJokerOwner ? 'has-joker' : ''}`}>
        <h3 className="old-maid-target-title">
          {t('oldMaid.pickFrom', {
            name: t(drawTarget.displayNameKey, drawTarget.displayNameKey)
          })}
        </h3>
        <div className="old-maid-target-cards">
          {drawTarget.hand.map((card, index) => {
            const isHinted = hintTarget === index;
            return (
              <button
                type="button"
                key={card.id}
                className={`old-maid-card-back ${phase !== 'player' || isResolving ? 'is-disabled' : ''} ${
                  isHinted ? 'is-hint' : ''
                }`}
                onClick={() => handlePlayerDraw(index)}
                disabled={phase !== 'player' || isResolving}
                aria-label={t('oldMaid.drawCard', 'カードを ひく')}
              />
            );
          })}
        </div>
        {isJokerOwner && <p className="old-maid-target-warning">{t('oldMaid.jokerWarning', 'ババが まぎれているかも…')}</p>}
      </div>
    );
  };

  return (
    <div className="old-maid-screen">
      <header className="old-maid-header">
        <button type="button" className="old-maid-exit" onClick={endSession}>
          {t('actions.back', 'もどる')}
        </button>
        <p className="old-maid-header-text">{t('oldMaid.goal', 'ババを だれかに わたそう！')}</p>
        <button
          type="button"
          className="old-maid-hint"
          onClick={() => handleHint(false)}
          disabled={phase !== 'player' || remainingHints <= 0 || isResolving}
        >
          {t('oldMaid.hint', 'ヒント')} ({remainingHints})
        </button>
      </header>

      <GameHud />

      <section className="old-maid-stage">
        <div className="old-maid-opponent-row">{opponentPlayers.map(renderOpponent)}</div>
        <div className="old-maid-status">
          <div className="old-maid-message">
            {message ?? t('oldMaid.goal', 'ババを だれかに わたそう！')}
          </div>
          <div className="old-maid-counter">
            {t('oldMaid.pairs', { count: discardedPairs, defaultValue: `ペア ${discardedPairs}` })}
          </div>
        </div>
        {renderTargetArea()}
      </section>

      <section className="old-maid-hand">
        <h2>{t('oldMaid.yourHand', 'あなたの てふだ')}</h2>
        <div className="old-maid-hand-row">
          {humanPlayer?.hand.length ? humanPlayer.hand.map(renderPlayerCard) : (
            <p className="old-maid-hand-empty">{t('oldMaid.handEmpty', 'カードは もう ないみたい！')}</p>
          )}
        </div>
      </section>

      <RewardToast schedule={rewardSchedule} />
    </div>
  );
};
