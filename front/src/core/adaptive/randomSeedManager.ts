type RandomOutcome = {
  gameId: string;
  roundId: string;
  success: boolean;
};

type WeightedValue<T extends string> = {
  value: T;
  weight: number;
};

const hashSeed = (seed: string) => {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const t = (h ^= h >>> 16) >>> 0;
    return (t & 0xfffffff) / 0x10000000;
  };
};

type ControlledRandomizerOptions = {
  seed: string;
  avoidRecent?: number;
};

export class ControlledRandomizer {
  private rng: () => number;

  private readonly avoidRecent: number;

  private readonly recentValues: string[] = [];

  private readonly usageCounter = new Map<string, number>();

  private readonly history: RandomOutcome[] = [];

  constructor({ seed, avoidRecent = 2 }: ControlledRandomizerOptions) {
    this.rng = hashSeed(seed);
    this.avoidRecent = avoidRecent;
  }

  reseed(seed: string) {
    this.rng = hashSeed(seed);
    this.recentValues.length = 0;
    this.usageCounter.clear();
  }

  nextFloat() {
    return this.rng();
  }

  next<T extends string>(values: WeightedValue<T>[]): T {
    if (values.length === 0) {
      throw new Error('ControlledRandomizer expects at least one value.');
    }

    const adjusted = values.map((entry) => {
      const usage = this.usageCounter.get(entry.value) ?? 0;
      const avoidancePenalty = this.recentValues.includes(entry.value) ? 0.25 : 1;
      const adjustedWeight = (entry.weight / (usage + 1)) * avoidancePenalty;
      return { ...entry, adjustedWeight };
    });

    const totalWeight = adjusted.reduce((sum, entry) => sum + entry.adjustedWeight, 0);
    let threshold = this.rng() * totalWeight;

    for (const entry of adjusted) {
      threshold -= entry.adjustedWeight;
      if (threshold <= 0) {
        this.track(entry.value);
        return entry.value;
      }
    }

    const fallback = adjusted[adjusted.length - 1];
    this.track(fallback.value);
    return fallback.value;
  }

  recordOutcome(outcome: RandomOutcome) {
    this.history.push(outcome);
    if (this.history.length > 64) {
      this.history.shift();
    }
  }

  getUsageSnapshot() {
    return new Map(this.usageCounter);
  }

  private track(value: string) {
    this.recentValues.unshift(value);
    if (this.recentValues.length > this.avoidRecent) {
      this.recentValues.pop();
    }
    this.usageCounter.set(value, (this.usageCounter.get(value) ?? 0) + 1);
  }
}
