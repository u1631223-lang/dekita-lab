import { ControlledRandomizer } from '@core/adaptive';
import { RewardCatalog, RewardContext, RewardEvent, RewardIntensity, RewardSchedule } from './types';

const BASE_CATALOG: RewardCatalog = [
  {
    id: 'sparkle-pop',
    intensity: 'base',
    audio: '/assets/sfx/sparkle-pop.mp3',
    animation: '/assets/animations/sparkle.json',
    narrationKey: 'reward.goodJob'
  },
  {
    id: 'soft-chime',
    intensity: 'soft',
    audio: '/assets/sfx/soft-chime.mp3',
    animation: '/assets/animations/soft-chime.json',
    narrationKey: 'reward.nice'
  },
  {
    id: 'fireworks',
    intensity: 'celebration',
    audio: '/assets/sfx/fireworks.mp3',
    animation: '/assets/animations/fireworks.json',
    narrationKey: 'reward.amazing'
  },
  {
    id: 'confetti-friends',
    intensity: 'celebration',
    audio: '/assets/sfx/confetti.mp3',
    animation: '/assets/animations/confetti.json',
    narrationKey: 'reward.super'
  },
  {
    id: 'twinkle-rise',
    intensity: 'base',
    audio: '/assets/sfx/twinkle.mp3',
    animation: '/assets/animations/twinkle.json',
    narrationKey: 'reward.keepGoing'
  }
];

const intensityWeights: Record<RewardIntensity, number> = {
  soft: 0.6,
  base: 1,
  celebration: 1.4
};

const tierToIntensity: Record<RewardContext['rewardTier'], RewardIntensity[]> = {
  base: ['soft', 'base'],
  streak: ['base'],
  super: ['celebration']
};

export class RewardScheduler {
  private readonly catalog = new Map<RewardIntensity, RewardEvent[]>();

  private readonly recentRewards: string[] = [];

  private readonly randomizer: ControlledRandomizer;

  private readonly triggerCooldownMs = 3000;

  private lastTriggerAt = 0;

  private allowCelebration = true;

  constructor({
    catalog = BASE_CATALOG,
    seed = 'dekita-rewards',
    allowCelebration = true
  }: { catalog?: RewardCatalog; seed?: string; allowCelebration?: boolean } = {}) {
    this.randomizer = new ControlledRandomizer({ seed });
    this.allowCelebration = allowCelebration;
    catalog.forEach((reward) => this.registerReward(reward));
  }

  registerReward(reward: RewardEvent) {
    if (!this.catalog.has(reward.intensity)) {
      this.catalog.set(reward.intensity, []);
    }
    this.catalog.get(reward.intensity)!.push(reward);
  }

  updateSettings(settings: { allowCelebration?: boolean }) {
    if (typeof settings.allowCelebration === 'boolean') {
      this.allowCelebration = settings.allowCelebration;
    }
  }

  schedule(context: RewardContext): RewardSchedule {
    const elapsedSinceLast = performance.now() - this.lastTriggerAt;
    const delayMs = elapsedSinceLast >= this.triggerCooldownMs ? 180 : this.triggerCooldownMs - elapsedSinceLast;
    const rawIntensities = tierToIntensity[context.rewardTier] ?? ['soft'];
    const intensities = rawIntensities.filter(
      (intensity) => intensity !== 'celebration' || this.allowCelebration
    );
    if (intensities.length === 0) {
      intensities.push('soft');
    }

    const candidates = intensities
      .flatMap((intensity) => this.catalog.get(intensity) ?? [])
      .filter((reward) => !this.recentRewards.includes(reward.id));

    const fallbackCandidates = intensities.flatMap((intensity) => this.catalog.get(intensity) ?? []);
    const usable = candidates.length > 0 ? candidates : fallbackCandidates;

    if (usable.length === 0) {
      throw new Error('Reward catalog is empty.');
    }

    const weighted = usable.map((reward) => ({
      value: reward.id,
      weight: intensityWeights[reward.intensity] ?? 1
    }));

    const rewardId = this.randomizer.next(weighted);
    const reward = usable.find((item) => item.id === rewardId) ?? usable[0];

    this.recentRewards.unshift(reward.id);
    if (this.recentRewards.length > 3) {
      this.recentRewards.pop();
    }

    this.lastTriggerAt = performance.now() + delayMs;

    return {
      delayMs,
      event: reward
    };
  }
}
