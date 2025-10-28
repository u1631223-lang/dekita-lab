import { describe, expect, it } from 'vitest';
import { ControlledRandomizer } from './randomSeedManager';

describe('ControlledRandomizer', () => {
  it('prefers less used categories', () => {
    const randomizer = new ControlledRandomizer({ seed: 'test-seed', avoidRecent: 2 });

    const first = randomizer.next([
      { value: 'a', weight: 1 },
      { value: 'b', weight: 1 },
      { value: 'c', weight: 1 }
    ]);

    const second = randomizer.next([
      { value: 'a', weight: 1 },
      { value: 'b', weight: 1 },
      { value: 'c', weight: 1 }
    ]);

    expect(second).not.toEqual(first);
  });
});
