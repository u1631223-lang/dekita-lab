import { ControlledRandomizer } from '@core/adaptive';
import { DifficultyLevel } from '@core/engine';
import {
  SHICHI_NARABE_SUITS,
  ShichiNarabeCard,
  ShichiNarabeFieldLane,
  ShichiNarabeOpponentState,
  ShichiNarabeRoundState,
  ShichiNarabeSuit
} from './types';
import { SHICHI_NARABE_DIFFICULTY } from './config';

const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;

const RANK_LABELS: Record<number, string> = {
  1: 'A',
  11: 'J',
  12: 'Q',
  13: 'K'
};

const OPPONENT_NAMES = [
  'shichiNarabe.ai.kai',
  'shichiNarabe.ai.mio',
  'shichiNarabe.ai.ren',
  'shichiNarabe.ai.haru',
  'shichiNarabe.ai.aki',
  'shichiNarabe.ai.suzu'
];

export const SUIT_ORDER: Record<ShichiNarabeSuit, number> = {
  spade: 0,
  heart: 1,
  diamond: 2,
  club: 3
};

export const rankLabel = (rank: number) => RANK_LABELS[rank] ?? String(rank);

export const sortCards = (cards: ShichiNarabeCard[]): ShichiNarabeCard[] =>
  [...cards].sort((a, b) => {
    if (a.suit !== b.suit) {
      return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
    }
    return a.rank - b.rank;
  });

const shuffle = <T>(randomizer: ControlledRandomizer, items: T[]): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(randomizer.nextFloat() * (index + 1));
    const tmp = result[index];
    result[index] = result[randomIndex];
    result[randomIndex] = tmp;
  }
  return result;
};

const createDeck = (randomizer: ControlledRandomizer): ShichiNarabeCard[] => {
  const cards = SHICHI_NARABE_SUITS.flatMap((suit) =>
    RANKS.map(
      (rank): ShichiNarabeCard => ({
        id: `${suit}-${rank}`,
        suit,
        rank,
        label: rankLabel(rank)
      })
    )
  );
  return shuffle(randomizer, cards);
};

const initializeField = (
  hands: ShichiNarabeCard[][]
): Record<ShichiNarabeSuit, ShichiNarabeFieldLane> => {
  const field = SHICHI_NARABE_SUITS.reduce(
    (acc, suit) => ({
      ...acc,
      [suit]: {
        lowest: 7,
        highest: 7,
        cards: [] as ShichiNarabeCard[]
      }
    }),
    {} as Record<ShichiNarabeSuit, ShichiNarabeFieldLane>
  );

  SHICHI_NARABE_SUITS.forEach((suit) => {
    for (let index = 0; index < hands.length; index += 1) {
      const cardIndex = hands[index].findIndex((card) => card.suit === suit && card.rank === 7);
      if (cardIndex >= 0) {
        const [seven] = hands[index].splice(cardIndex, 1);
        field[suit] = {
          lowest: 7,
          highest: 7,
          cards: [seven]
        };
        break;
      }
    }
  });

  return field;
};

const buildOpponents = (hands: ShichiNarabeCard[][]): ShichiNarabeOpponentState[] =>
  hands.map((cards, index) => ({
    id: `opponent-${index + 1}`,
    displayNameKey: OPPONENT_NAMES[index % OPPONENT_NAMES.length],
    cards: sortCards(cards),
    passesUsed: 0
  }));

export const createInitialShichiNarabeState = (
  difficulty: DifficultyLevel,
  randomizer: ControlledRandomizer
): ShichiNarabeRoundState => {
  const config = SHICHI_NARABE_DIFFICULTY[difficulty] ?? SHICHI_NARABE_DIFFICULTY.lv1;
  const deck = createDeck(randomizer);
  const totalPlayers = Math.max(2, 1 + config.opponentCount);
  const hands = Array.from({ length: totalPlayers }, () => [] as ShichiNarabeCard[]);

  deck.forEach((card, index) => {
    hands[index % totalPlayers].push(card);
  });

  const field = initializeField(hands);
  const playerHand = sortCards(hands[0]);
  const opponents = buildOpponents(hands.slice(1));

  return {
    field,
    playerHand,
    opponents,
    config
  };
};

export const canPlayCard = (
  card: ShichiNarabeCard,
  field: Record<ShichiNarabeSuit, ShichiNarabeFieldLane>
) => {
  const lane = field[card.suit];
  if (!lane) {
    return false;
  }
  const { lowest, highest } = lane;
  return card.rank === lowest - 1 || card.rank === highest + 1;
};

export const playCardOnField = (
  field: Record<ShichiNarabeSuit, ShichiNarabeFieldLane>,
  card: ShichiNarabeCard
): Record<ShichiNarabeSuit, ShichiNarabeFieldLane> => {
  const lane = field[card.suit];
  if (!lane) {
    return field;
  }
  const updatedLane: ShichiNarabeFieldLane = {
    lowest: lane.lowest,
    highest: lane.highest,
    cards: [...lane.cards]
  };

  if (card.rank < updatedLane.lowest) {
    updatedLane.lowest = card.rank;
    updatedLane.cards = [card, ...updatedLane.cards];
  } else if (card.rank > updatedLane.highest) {
    updatedLane.highest = card.rank;
    updatedLane.cards = [...updatedLane.cards, card];
  }

  return {
    ...field,
    [card.suit]: updatedLane
  };
};

export const getPlayableCards = (
  hand: ShichiNarabeCard[],
  field: Record<ShichiNarabeSuit, ShichiNarabeFieldLane>
) => hand.filter((card) => canPlayCard(card, field));

export const hasAnyPlayableCard = (
  hand: ShichiNarabeCard[],
  field: Record<ShichiNarabeSuit, ShichiNarabeFieldLane>
) => getPlayableCards(hand, field).length > 0;
