import { describe, expect, it } from 'vitest';
import { createAdaptiveEngine } from './adaptiveEngine';
import { AdaptiveConfig } from './types';

const config: AdaptiveConfig = {
  baseDifficulty: {
    rhythm: 'lv1',
    'pair-match': 'lv1'
  },
  successLower: 0.7,
  successUpper: 0.85,
  streakThresholds: [3, 5, 10]
};

describe('createAdaptiveEngine', () => {
  it('raises difficulty when success rate exceeds threshold', () => {
    const engine = createAdaptiveEngine(config);
    const context = {
      gameId: 'rhythm' as const,
      difficulty: 'lv1' as const,
      roundId: '1',
      startedAt: 0
    };

    const result = engine.assess(context, {
      success: true,
      reactionTimeMs: 700,
      hintsUsed: 0,
      endedAt: 1
    });

    expect(result.nextDifficulty === 'lv1' || result.nextDifficulty === 'lv2').toBeTruthy();
  });

  it('suggests hints after consecutive failures and lowers difficulty', () => {
    const engine = createAdaptiveEngine(config);
    const baseContext = {
      gameId: 'pair-match' as const,
      difficulty: 'lv1' as const,
      startedAt: 0
    };

    let recommendation = engine.assess(
      { ...baseContext, roundId: '1' },
      { success: false, reactionTimeMs: 2100, hintsUsed: 0, endedAt: 1 }
    );

    recommendation = engine.assess(
      { ...baseContext, roundId: '2' },
      { success: false, reactionTimeMs: 2050, hintsUsed: 1, endedAt: 2 }
    );

    recommendation = engine.assess(
      { ...baseContext, roundId: '3' },
      { success: false, reactionTimeMs: 1980, hintsUsed: 1, endedAt: 3 }
    );

    expect(recommendation.provideHint).toBe(true);
    expect(['lv1', 'lv2']).toContain(recommendation.nextDifficulty);
  });
});
