import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SessionSummary } from '@core/telemetry';
import { GameId } from '@core/engine';

type SessionStatus = 'idle' | 'active' | 'paused';

export interface ProgressState {
  profile: {
    onboardingCompleted: boolean;
  };
  session: {
    status: SessionStatus;
    activeGame?: GameId;
    startedAt: number | null;
    elapsedMs: number;
    reminderShown: boolean;
  };
  lastSummary: SessionSummary | null;
  stars: number;
  milestonesUnlocked: number[];
  lastMilestone: number | null;
  actions: {
    completeOnboarding: () => void;
    resetOnboarding: () => void;
    startSession: (gameId: GameId) => void;
    pauseSession: () => void;
    resumeSession: () => void;
    endSession: (summary: SessionSummary) => void;
    markReminderShown: () => void;
    addStars: (amount: number) => void;
    clearMilestone: () => void;
    resetProgressData: () => void;
  };
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      profile: {
        onboardingCompleted: false
      },
      session: {
        status: 'idle',
        activeGame: undefined,
        startedAt: null,
        elapsedMs: 0,
        reminderShown: false
      },
      lastSummary: null,
      stars: 0,
      milestonesUnlocked: [],
      lastMilestone: null,
      actions: {
        completeOnboarding: () =>
          set((state) => ({
            profile: { ...state.profile, onboardingCompleted: true }
          })),
        resetOnboarding: () =>
          set((state) => ({
            profile: { ...state.profile, onboardingCompleted: false }
          })),
        startSession: (gameId) =>
          set({
            session: {
              status: 'active',
              activeGame: gameId,
              startedAt: Date.now(),
              elapsedMs: 0,
              reminderShown: false
            }
          }),
        pauseSession: () =>
          set((state) => ({
            session: {
              ...state.session,
              status: 'paused',
              elapsedMs: (state.session.elapsedMs ?? 0) + getElapsed(state.session.startedAt)
            }
          })),
        resumeSession: () =>
          set((state) => ({
            session: {
              ...state.session,
              status: 'active',
              startedAt: Date.now()
            }
          })),
        endSession: (summary) =>
          set((state) => ({
            session: {
              status: 'idle',
              activeGame: undefined,
              startedAt: null,
              elapsedMs: 0,
              reminderShown: false
            },
            lastSummary: summary
          })),
        markReminderShown: () =>
          set((state) => ({
            session: { ...state.session, reminderShown: true }
          })),
        addStars: (amount) =>
          set((state) => {
            const milestones = [5, 15, 30, 50];
            const stars = state.stars + Math.max(0, amount);
            let lastMilestone: number | null = null;
            const unlocked = new Set(state.milestonesUnlocked);
            milestones.forEach((value) => {
              if (stars >= value && !unlocked.has(value)) {
                unlocked.add(value);
                lastMilestone = value;
              }
            });
            return {
              stars,
              milestonesUnlocked: Array.from(unlocked).sort((a, b) => a - b),
              lastMilestone
            };
          }),
        clearMilestone: () => set({ lastMilestone: null }),
        resetProgressData: () =>
          set({
            stars: 0,
            milestonesUnlocked: [],
            lastMilestone: null,
            lastSummary: null
          })
      }
    }),
    {
      name: 'dekita-progress-store',
      partialize: (state) => ({
        profile: state.profile,
        lastSummary: state.lastSummary,
        stars: state.stars,
        milestonesUnlocked: state.milestonesUnlocked
      })
    }
  )
);

const getElapsed = (startedAt: number | null) => {
  if (!startedAt) {
    return 0;
  }
  return Date.now() - startedAt;
};
