import { ControlledRandomizer } from '@core/adaptive';
import { DifficultyLevel } from '@core/engine';
import {
  ConcentrationCard,
  ConcentrationConfig,
  ConcentrationDifficultyMap,
  Rank,
  Suit,
  CardColor
} from './types';

const SUIT_COLOR: Record<Suit, CardColor> = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black'
};

const RANK_SEQUENCE: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const CONCENTRATION_DIFFICULTY: ConcentrationDifficultyMap = {
  lv1: {
    rows: 3,
    columns: 4,
    hideDelayMs: 3000,
    rankPool: RANK_SEQUENCE.slice(0, 6),
    suitPool: ['hearts', 'diamonds'],
    matchRule: 'rank'
  },
  lv2: {
    rows: 4,
    columns: 6,
    hideDelayMs: 2000,
    rankPool: RANK_SEQUENCE.slice(0, 12),
    suitPool: ['hearts', 'diamonds'],
    matchRule: 'rank'
  },
  lv3: {
    rows: 4,
    columns: 13,
    hideDelayMs: 1000,
    rankPool: RANK_SEQUENCE,
    suitPool: ['hearts', 'diamonds', 'clubs', 'spades'],
    matchRule: 'rank'
  },
  lv4: {
    rows: 4,
    columns: 13,
    hideDelayMs: 900,
    rankPool: RANK_SEQUENCE,
    suitPool: ['hearts', 'diamonds', 'clubs', 'spades'],
    matchRule: 'rank'
  },
  lv5: {
    rows: 4,
    columns: 13,
    hideDelayMs: 800,
    rankPool: RANK_SEQUENCE,
    suitPool: ['hearts', 'diamonds', 'clubs', 'spades'],
    matchRule: 'rank'
  },
  lv6: {
    rows: 4,
    columns: 13,
    hideDelayMs: 700,
    rankPool: RANK_SEQUENCE,
    suitPool: ['hearts', 'diamonds', 'clubs', 'spades'],
    matchRule: 'rank'
  }
};

const validateCapacity = (config: ConcentrationConfig) => {
  const totalCards = config.rows * config.columns;
  if (totalCards % 2 !== 0) {
    throw new Error('Concentration grid must contain an even number of cards.');
  }
  const totalPairs = totalCards / 2;
  const suitsPerPair = Math.floor(config.suitPool.length / 2);
  if (suitsPerPair <= 0) {
    throw new Error('At least two suits are required to form a pair.');
  }
  const maxPairs = config.rankPool.length * suitsPerPair;
  if (totalPairs > maxPairs) {
    throw new Error('Configuration cannot generate enough unique pairs.');
  }
  return totalPairs;
};

const selectPairs = (config: ConcentrationConfig, randomizer: ControlledRandomizer, totalPairs: number) => {
  const suitsByRank = new Map<Rank, Suit[]>(
    config.rankPool.map((rank) => [rank, [...config.suitPool]])
  );
  const pairs: { rank: Rank; suits: [Suit, Suit] }[] = [];

  for (let index = 0; index < totalPairs; index += 1) {
    const candidates = Array.from(suitsByRank.entries()).filter(([, suits]) => suits.length >= 2);
    if (candidates.length === 0) {
      throw new Error('No rank has enough remaining suits to build a pair.');
    }

    const selectedRank = randomizer.next(
      candidates.map(([rank]) => ({ value: rank, weight: 1 }))
    ) as Rank;
    const availableSuits = suitsByRank.get(selectedRank);
    if (!availableSuits || availableSuits.length < 2) {
      index -= 1;
      continue;
    }

    const firstSuit = randomizer.next(
      availableSuits.map((suit) => ({ value: suit, weight: 1 }))
    ) as Suit;
    const remainingAfterFirst = availableSuits.filter((suit) => suit !== firstSuit);
    const secondSuit = randomizer.next(
      remainingAfterFirst.map((suit) => ({ value: suit, weight: 1 }))
    ) as Suit;

    suitsByRank.set(
      selectedRank,
      remainingAfterFirst.filter((suit) => suit !== secondSuit)
    );

    pairs.push({ rank: selectedRank, suits: [firstSuit, secondSuit] });
  }

  return pairs;
};

export const createDeck = (difficulty: DifficultyLevel, randomizer: ControlledRandomizer) => {
  const config = CONCENTRATION_DIFFICULTY[difficulty] ?? CONCENTRATION_DIFFICULTY.lv1;
  const totalPairs = validateCapacity(config);
  const selectedPairs = selectPairs(config, randomizer, totalPairs);

  const deck: ConcentrationCard[] = selectedPairs.flatMap(({ rank, suits }, index) => {
    const pairId = `${rank}-${index}`;
    return suits.map((suit, offset) => ({
      id: `${pairId}-${offset}`,
      pairId,
      rank,
      suit,
      color: SUIT_COLOR[suit],
      revealed: false,
      matched: false
    }));
  });

  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomizer.nextFloat() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return { deck: shuffled, config };
};
