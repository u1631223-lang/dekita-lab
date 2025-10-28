import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RewardScheduler } from './rewardScheduler';

beforeEach(() => {
  vi.stubGlobal('performance', {
    now: () => 1000
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('RewardScheduler', () => {
  it('returns a reward schedule based on tier', () => {
    const scheduler = new RewardScheduler();
    const schedule = scheduler.schedule({ streak: 3, rewardTier: 'streak' });
    expect(schedule.event).toBeTruthy();
    expect(schedule.delayMs).toBeGreaterThanOrEqual(0);
  });
});
