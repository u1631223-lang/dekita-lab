export type RewardIntensity = 'soft' | 'base' | 'celebration';

export interface RewardEvent {
  id: string;
  intensity: RewardIntensity;
  audio: string;
  animation: string;
  narrationKey: string;
}

export interface RewardSchedule {
  delayMs: number;
  event: RewardEvent;
}

export interface RewardContext {
  streak: number;
  rewardTier: 'base' | 'streak' | 'super';
}

export type RewardCatalog = RewardEvent[];
