import { describe, expect, it } from 'vitest';
import { createRhythmTapModule } from './module';
import { ControlledRandomizer } from '@core/adaptive';

describe('createRhythmTapModule', () => {
  it('creates a pattern respecting difficulty settings', () => {
    const module = createRhythmTapModule();
    const randomizer = new ControlledRandomizer({ seed: 'test-seed' });
    const round = module.createRound({ difficulty: 'lv1', randomizer });
    expect(round.pattern.length).toBeGreaterThanOrEqual(3);
    expect(round.stimuliPool.length).toBeGreaterThan(0);
  });
});
