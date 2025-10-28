import { describe, expect, it } from 'vitest';
import { createTelemetryStore } from './metricsStore';

describe('createTelemetryStore', () => {
  it('records entries and calculates summary', () => {
    const store = createTelemetryStore();
    store.reset();
    store.record({
      gameId: 'rhythm',
      success: true,
      reactionTimeMs: 800,
      difficulty: 'lv1',
      timestamp: Date.now(),
      hintsUsed: 0
    });
    store.record({
      gameId: 'rhythm',
      success: false,
      reactionTimeMs: 1200,
      difficulty: 'lv1',
      timestamp: Date.now(),
      hintsUsed: 1
    });
    store.record({
      gameId: 'pair-match',
      success: true,
      reactionTimeMs: 1500,
      difficulty: 'lv1',
      timestamp: Date.now(),
      hintsUsed: 0
    });

    const summary = store.summary();
    expect(summary.totalRounds).toBeGreaterThanOrEqual(2);
    expect(summary.successRate).toBeGreaterThan(0);
    expect(summary.reactionTrendMs).toBeGreaterThan(0);

    const rhythmSummary = store.summaryForGame('rhythm');
    expect(rhythmSummary.totalRounds).toBe(2);
    expect(rhythmSummary.reactionTrendMs).toBeGreaterThan(0);
  });
});
