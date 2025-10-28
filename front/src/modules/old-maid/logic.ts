import { ControlledRandomizer } from '@core/adaptive';
import {
  OldMaidCard,
  OldMaidPairRemoval,
  OldMaidPlayerState,
  OldMaidRank,
  OldMaidSuit
} from './types';

const SUITS: OldMaidSuit[] = ['♠', '♥', '♦', '♣'];
const RANKS: OldMaidRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const createDeck = (randomizer: ControlledRandomizer): OldMaidCard[] => {
  const deck: OldMaidCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        isJoker: false
      });
    }
  }
  deck.push({
    id: 'JOKER',
    suit: 'JOKER',
    rank: 'JOKER',
    isJoker: true
  });

  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomizer.nextFloat() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const dealHands = (deck: OldMaidCard[], totalPlayers: number): OldMaidCard[][] => {
  const hands = Array.from({ length: totalPlayers }, () => [] as OldMaidCard[]);
  deck.forEach((card, index) => {
    hands[index % totalPlayers].push(card);
  });
  return hands;
};

export const stripPairs = (
  hand: OldMaidCard[]
): { remaining: OldMaidCard[]; removedPairs: OldMaidPairRemoval[] } => {
  const pending = new Map<OldMaidRank, OldMaidCard>();
  const remaining: OldMaidCard[] = [];
  const removedPairs: OldMaidPairRemoval[] = [];

  hand.forEach((card) => {
    if (card.isJoker) {
      remaining.push(card);
      return;
    }
    const existing = pending.get(card.rank);
    if (existing) {
      removedPairs.push({
        rank: card.rank,
        cards: [existing, card]
      });
      pending.delete(card.rank);
    } else {
      pending.set(card.rank, card);
    }
  });

  pending.forEach((card) => {
    remaining.push(card);
  });

  return {
    remaining,
    removedPairs
  };
};

export const countActivePlayers = (players: OldMaidPlayerState[]) =>
  players.filter((player) => player.hand.length > 0).length;

export const findJokerHolderId = (players: OldMaidPlayerState[]): string | null => {
  for (const player of players) {
    if (player.hand.some((card) => card.isJoker)) {
      return player.id;
    }
  }
  return null;
};

export const findNextActiveIndex = (players: OldMaidPlayerState[], currentIndex: number) => {
  if (players.length === 0) {
    return 0;
  }
  const activeCount = countActivePlayers(players);
  if (activeCount <= 1) {
    return currentIndex;
  }
  for (let offset = 1; offset <= players.length; offset += 1) {
    const nextIndex = (currentIndex + offset) % players.length;
    if (players[nextIndex].hand.length > 0) {
      return nextIndex;
    }
  }
  return currentIndex;
};
