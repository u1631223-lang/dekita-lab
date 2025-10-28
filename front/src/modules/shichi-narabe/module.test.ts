import { describe, expect, it } from 'vitest';
import { ControlledRandomizer } from '@core/adaptive';
import { createShichiNarabeModule } from './module';

describe('createShichiNarabeModule', () => {
  it('creates a valid initial round state', () => {
    const module = createShichiNarabeModule();
    const randomizer = new ControlledRandomizer({ seed: 'shichi-narabe-seed' });
    const round = module.createRound({ difficulty: 'lv2', randomizer });

    expect(round.opponents).toHaveLength(round.config.opponentCount);
    expect(round.playerHand.length).toBeGreaterThan(0);

    const fieldCardCount = Object.values(round.field).reduce(
      (total, lane) => total + lane.cards.length,
      0
    );
    const handCardCount = round.playerHand.length + round.opponents.reduce((total, opponent) => total + opponent.cards.length, 0);
    expect(fieldCardCount + handCardCount).toBe(52);

    Object.values(round.field).forEach((lane) => {
      expect(lane.cards.some((card) => card.rank === 7)).toBe(true);
      expect(lane.lowest).toBeLessThanOrEqual(lane.highest);
    });

    round.opponents.forEach((opponent) => {
      expect(opponent.displayNameKey).toMatch(/^shichiNarabe\.ai\./);
    });
  });
});
