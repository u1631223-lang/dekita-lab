import { ControlledRandomizer } from '@core/adaptive';
import { DifficultyLevel } from '@core/engine';
import {
  OldMaidConfig,
  OldMaidDifficultyMap,
  OldMaidPlayerState,
  OldMaidRoundState
} from './types';
import { createDeck, dealHands, stripPairs, findJokerHolderId, findNextActiveIndex } from './logic';

export const OLD_MAID_AI_NAME_KEYS = ['oldMaid.ai.sunny', 'oldMaid.ai.moon', 'oldMaid.ai.comet'];

export const OLD_MAID_DIFFICULTY: OldMaidDifficultyMap = {
  lv1: {
    aiPlayers: 2,
    maxHints: 3,
    aiDelayMs: 1100,
    jokerAvoidance: 0.3,
    revealHintMs: 1600
  },
  lv2: {
    aiPlayers: 2,
    maxHints: 2,
    aiDelayMs: 900,
    jokerAvoidance: 0.6,
    revealHintMs: 1100
  },
  lv3: {
    aiPlayers: 3,
    maxHints: 1,
    aiDelayMs: 800,
    jokerAvoidance: 0.8,
    revealHintMs: 0
  }
};

const createAiPlayer = (index: number): OldMaidPlayerState => ({
  id: `ai-${index + 1}`,
  displayNameKey: OLD_MAID_AI_NAME_KEYS[index] ?? 'oldMaid.ai.rival',
  isHuman: false,
  hand: [],
  status: 'playing'
});

export const createInitialRoundState = (
  difficulty: DifficultyLevel,
  randomizer: ControlledRandomizer
): OldMaidRoundState => {
  const config = OLD_MAID_DIFFICULTY[difficulty] ?? OLD_MAID_DIFFICULTY.lv1!;
  const totalPlayers = config.aiPlayers + 1;
  const deck = createDeck(randomizer);
  const rawHands = dealHands(deck, totalPlayers);

  let discardedPairs = 0;
  const players: OldMaidPlayerState[] = rawHands.map((hand, index) => {
    const base: OldMaidPlayerState =
      index === 0
        ? {
            id: 'player',
            displayNameKey: 'oldMaid.player.you',
            isHuman: true,
            hand: [],
            status: 'playing'
          }
        : createAiPlayer(index - 1);

    const { remaining, removedPairs } = stripPairs(hand);
    discardedPairs += removedPairs.length;
    return {
      ...base,
      hand: remaining,
      status: remaining.length === 0 ? 'finished' : base.status
    };
  });

  const humanIndex = players.findIndex((player) => player.isHuman && player.hand.length > 0);
  const fallbackIndex = players.findIndex((player) => player.hand.length > 0);
  const firstIndex = humanIndex !== -1 ? humanIndex : fallbackIndex !== -1 ? fallbackIndex : 0;
  const normalizedIndex = findNextActiveIndex(players, (firstIndex - 1 + players.length) % players.length);

  return {
    players,
    turnIndex: normalizedIndex,
    jokerHolderId: findJokerHolderId(players),
    discardedPairs,
    config
  };
};
