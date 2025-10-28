import { describe, expect, it } from 'vitest';
import { createPairMatchModule } from './module';
import { ControlledRandomizer } from '@core/adaptive';

describe('createPairMatchModule', () => {
  it('creates a deck with matching pairs', () => {
    const module = createPairMatchModule();
    const randomizer = new ControlledRandomizer({ seed: 'pairs' });
    const round = module.createRound({ difficulty: 'lv1', randomizer });
    expect(round.deck.length % 2).toBe(0);
    const pairIds = new Set(round.deck.map((card) => card.pairId));
    expect(pairIds.size * 2).toBe(round.deck.length);
  });
});
