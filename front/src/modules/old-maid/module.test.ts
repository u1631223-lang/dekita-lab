import { describe, expect, it } from 'vitest';
import { ControlledRandomizer } from '@core/adaptive';
import { createOldMaidModule } from './module';

describe('createOldMaidModule', () => {
  it('creates a deterministic round state with stripped pairs', () => {
    const module = createOldMaidModule();
    const randomizer = new ControlledRandomizer({ seed: 'old-maid-seed' });
    const round = module.createRound({ difficulty: 'lv1', randomizer });

    const remainingCards = round.players.reduce((total, player) => total + player.hand.length, 0);
    expect(remainingCards + round.discardedPairs * 2).toBe(53);

    round.players.forEach((player) => {
      const rankCounts = new Map<string, number>();
      player.hand
        .filter((card) => !card.isJoker)
        .forEach((card) => {
          rankCounts.set(card.rank, (rankCounts.get(card.rank) ?? 0) + 1);
        });
      rankCounts.forEach((count) => {
        expect(count).toBeLessThanOrEqual(1);
      });
    });

    const jokerOwners = round.players.filter((player) => player.hand.some((card) => card.isJoker));
    expect(jokerOwners).toHaveLength(1);
    expect(round.turnIndex).toBeGreaterThanOrEqual(0);
  });
});
