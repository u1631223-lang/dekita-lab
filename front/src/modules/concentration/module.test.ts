import { describe, expect, it } from 'vitest';
import { ControlledRandomizer } from '@core/adaptive';
import { createConcentrationModule } from './module';

describe('createConcentrationModule', () => {
  it('generates decks with matching pairs per difficulty', () => {
    const module = createConcentrationModule();
    const randomizer = new ControlledRandomizer({ seed: 'concentration-lv1' });
    const round = module.createRound({ difficulty: 'lv1', randomizer });

    expect(round.deck.length % 2).toBe(0);
    const groupSizes = Object.values(
      round.deck.reduce<Record<string, number>>((acc, card) => {
        acc[card.pairId] = (acc[card.pairId] ?? 0) + 1;
        return acc;
      }, {})
    );
    expect(groupSizes.every((count) => count === 2)).toBe(true);
  });

  it('respects suit capacity for the full deck', () => {
    const module = createConcentrationModule();
    const randomizer = new ControlledRandomizer({ seed: 'concentration-lv3' });
    const round = module.createRound({ difficulty: 'lv3', randomizer });

    expect(round.deck.length).toBe(52);

    const rankToSuits = round.deck.reduce<Record<string, Set<string>>>((acc, card) => {
      if (!acc[card.rank]) {
        acc[card.rank] = new Set();
      }
      acc[card.rank].add(card.suit);
      return acc;
    }, {});

    Object.values(rankToSuits).forEach((suits) => {
      expect(suits.size).toBeLessThanOrEqual(4);
    });

    const pairToCards = round.deck.reduce<Record<string, { rank: string; suits: Set<string> }>>((acc, card) => {
      if (!acc[card.pairId]) {
        acc[card.pairId] = { rank: card.rank, suits: new Set([card.suit]) };
        return acc;
      }
      acc[card.pairId].suits.add(card.suit);
      expect(acc[card.pairId].rank).toBe(card.rank);
      return acc;
    }, {});

    Object.values(pairToCards).forEach((entry) => {
      expect(entry.suits.size).toBe(2);
    });
  });
});
