import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionMachine } from './sessionMachine';
import { AdaptiveRecommendation } from './types';

const mockRecommendation: AdaptiveRecommendation = {
  nextDifficulty: 'lv1',
  provideHint: false,
  rewardTier: 'base'
};

describe('SessionMachine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('crypto', {
      randomUUID: () => 'round-1'
    });
    vi.stubGlobal('performance', {
      now: () => 1234
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('notifies listeners about stage transitions and rounds', () => {
    const events: string[] = [];
    const machine = new SessionMachine({
      onRecommendation: () => mockRecommendation
    });

    machine.subscribe((event) => {
      if (event.type === 'stage-changed') {
        events.push(`stage:${event.stage}`);
      }
      if (event.type === 'round-started') {
        events.push(`start:${event.context.gameId}`);
      }
      if (event.type === 'round-finished') {
        events.push(`finish:${event.context.roundId}`);
      }
    });

    const context = machine.startGame('rhythm', 'lv1');
    machine.finishRound(context, {
      success: true,
      reactionTimeMs: 800,
      hintsUsed: 0,
      endedAt: 2345
    });
    machine.endGame();
    machine.returnToHub();

    expect(events).toEqual([
      'stage:game',
      'start:rhythm',
      'finish:round-1',
      'stage:summary',
      'stage:hub'
    ]);
  });
});
