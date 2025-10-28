import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export interface RewardSettingsState {
  volume: number;
  allowCelebration: boolean;
  muted: boolean;
  actions: {
    setVolume: (volume: number) => void;
    setAllowCelebration: (allow: boolean) => void;
    setMuted: (muted: boolean) => void;
  };
}

export const useRewardSettingsStore = create<RewardSettingsState>()(
  persist(
    (set) => ({
      volume: 0.8,
      allowCelebration: true,
      muted: false,
      actions: {
        setVolume: (volume) => set({ volume: clamp(volume) }),
        setAllowCelebration: (allow) => set({ allowCelebration: allow }),
        setMuted: (muted) => set({ muted })
      }
    }),
    {
      name: 'reward-settings'
    }
  )
);
