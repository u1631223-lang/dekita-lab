import { useCallback, useRef } from 'react';
import { useRewardSettingsStore } from '@core/rewards';

const hashToFrequency = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const base = 220;
  const range = 440;
  const normalized = Math.abs(hash % range);
  return base + normalized;
};

const BEAT_DURATION_MS = 220;

export const useAudioCue = () => {
  const contextRef = useRef<AudioContext>();
  const { volume, muted } = useRewardSettingsStore((state) => ({
    volume: state.volume,
    muted: state.muted
  }));

  const ensureContext = useCallback(async () => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    if (contextRef.current.state === 'suspended') {
      try {
        await contextRef.current.resume();
      } catch {
        // ignore
      }
    }
    return contextRef.current;
  }, []);

  const play = useCallback(
    async (id: string) => {
      if (muted) {
        return;
      }
      const ctx = await ensureContext();
      if (!ctx) {
        return;
      }
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = hashToFrequency(id);
      gain.gain.value = volume * 0.4;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      oscillator.start(now);
      oscillator.stop(now + BEAT_DURATION_MS / 1000);
    },
    [ensureContext, muted, volume]
  );

  return { play };
};
