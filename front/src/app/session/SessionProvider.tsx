import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  SessionMachine,
  SessionStage,
  DifficultyLevel,
  GameId,
  RoundContext,
  RoundResult,
  AdaptiveRecommendation,
  GameModule,
  getGameModule
} from '@core/engine';
import { ControlledRandomizer, createAdaptiveEngine, AdaptiveConfig, AdaptiveSnapshot } from '@core/adaptive';
import { RewardScheduler, RewardSchedule, useRewardSettingsStore } from '@core/rewards';
import { createTelemetryStore, SessionSummary } from '@core/telemetry';
import { useProgressStore } from '@core/state';

type SessionControllerValue = {
  stage: SessionStage;
  activeGame: GameId | null;
  currentDifficulty: DifficultyLevel;
  currentRound: RoundContext | null;
  lastRecommendation: AdaptiveRecommendation | null;
  rewardSchedule: RewardSchedule | null;
  telemetrySummary: SessionSummary | null;
  adaptiveSnapshot: AdaptiveSnapshot;
  currentModule: GameModule | null;
  roundState: unknown;
  currentStats: { gameId: GameId; summary: SessionSummary } | null;
  startGame: (gameId: GameId) => void;
  recordRound: (result: RoundResult) => void;
  endSession: () => void;
  returnToHub: () => void;
  resetProgress: () => void;
};

const SessionControllerContext = createContext<SessionControllerValue | undefined>(undefined);

const ADAPTIVE_CONFIG: AdaptiveConfig = {
  baseDifficulty: {
    rhythm: 'lv1',
    'pair-match': 'lv1',
    concentration: 'lv1',
    'sequence-spark': 'lv1',
    'shape-builder': 'lv1',
    'card-sprint': 'lv1'
  },
  successLower: 0.7,
  successUpper: 0.85,
  streakThresholds: [3, 5, 10]
};

const useSessionMachine = () => {
  const adaptiveEngineRef = useRef(createAdaptiveEngine(ADAPTIVE_CONFIG));
  const machineRef = useRef(
    new SessionMachine({
      onRecommendation: (context, result) => adaptiveEngineRef.current.assess(context, result)
    })
  );
  return { machineRef, adaptiveEngineRef };
};

type SessionProviderProps = {
  children: ReactNode;
};

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const { machineRef, adaptiveEngineRef } = useSessionMachine();
  const telemetryStoreRef = useRef(createTelemetryStore());
  const rewardSchedulerRef = useRef(new RewardScheduler());
  const gameModuleRef = useRef<GameModule | null>(null);
  const randomizersRef = useRef(new Map<GameId, ControlledRandomizer>());
  const nextRoundTimerRef = useRef<number>();
  const [stage, setStage] = useState<SessionStage>('hub');
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>('lv1');
  const [currentRound, setCurrentRound] = useState<RoundContext | null>(null);
  const [rewardSchedule, setRewardSchedule] = useState<RewardSchedule | null>(null);
  const [lastRecommendation, setLastRecommendation] = useState<AdaptiveRecommendation | null>(null);
  const [telemetrySummary, setTelemetrySummary] = useState<SessionSummary | null>(null);
  const [adaptiveSnapshot, setAdaptiveSnapshot] = useState(adaptiveEngineRef.current.getState());
  const [currentModule, setCurrentModule] = useState<GameModule | null>(null);
  const [roundState, setRoundState] = useState<unknown>(null);
  const [currentStats, setCurrentStats] = useState<{ gameId: GameId; summary: SessionSummary } | null>(null);

  const progressActions = useProgressStore((state) => state.actions);
  const allowCelebration = useRewardSettingsStore((state) => state.allowCelebration);

  const ensureRandomizer = (gameId: GameId) => {
    if (!randomizersRef.current.has(gameId)) {
      randomizersRef.current.set(gameId, new ControlledRandomizer({ seed: `module-${gameId}` }));
    }
    return randomizersRef.current.get(gameId)!;
  };

  const resolveModule = (gameId: GameId) => {
    const existing = gameModuleRef.current;
    if (existing && existing.id === gameId) {
      setCurrentModule(existing);
      return existing;
    }
    const module = getGameModule(gameId);
    gameModuleRef.current = module;
    setCurrentModule(module);
    return module;
  };

  useEffect(() => {
    const unsubscribe = machineRef.current.subscribe((event) => {
      if (event.type === 'stage-changed') {
        setStage(event.stage);
        if (event.stage !== 'game') {
          setRewardSchedule(null);
        }
        if (event.stage === 'hub' || event.stage === 'summary') {
          setActiveGame(null);
          setCurrentRound(null);
          setLastRecommendation(null);
          setRoundState(null);
          if (event.stage === 'hub') {
            gameModuleRef.current = null;
            setCurrentModule(null);
            setCurrentStats(null);
          }
        }
      }
      if (event.type === 'round-started') {
        setCurrentRound(event.context);
        setCurrentDifficulty(event.context.difficulty);
        const module = resolveModule(event.context.gameId);
        const randomizer = ensureRandomizer(event.context.gameId);
        const state = module.createRound({
          difficulty: event.context.difficulty,
          randomizer
        });
        setRoundState(state);
      }
    });

    // ✅ cleanup関数に変更
    return () => {
      unsubscribe();
    };
  }, [machineRef]);

  useEffect(() => {
    rewardSchedulerRef.current.updateSettings({ allowCelebration });
  }, [allowCelebration]);

  const startGame = (gameId: GameId) => {
    const snapshot = adaptiveEngineRef.current.getState();
    const difficulty = snapshot.difficultyByGame?.[gameId] ?? ADAPTIVE_CONFIG.baseDifficulty[gameId];
    resolveModule(gameId);
    ensureRandomizer(gameId);
    const preSummary = telemetryStoreRef.current.summaryForGame(gameId);
    setCurrentStats({ gameId, summary: preSummary });
    progressActions.startSession(gameId);
    setActiveGame(gameId);
    machineRef.current.startGame(gameId, difficulty);
  };

  const recordRound = (result: RoundResult) => {
    if (!currentRound) {
      return;
    }
    const module = resolveModule(currentRound.gameId);
    // ✅ unknown回避
    const normalized = module.evaluate({ state: roundState, input: result }) as any;

    telemetryStoreRef.current.record({
      gameId: currentRound.gameId,
      success: normalized.success,
      reactionTimeMs: normalized.reactionTimeMs,
      difficulty: currentRound.difficulty,
      timestamp: Date.now(),
      hintsUsed: normalized.hintsUsed
    });

    const recommendation = machineRef.current.finishRound(currentRound, normalized);
    setLastRecommendation(recommendation);
    const snapshot = adaptiveEngineRef.current.getState();
    setAdaptiveSnapshot(snapshot);
    const perGame = telemetryStoreRef.current.summaryForGame(currentRound.gameId);
    setCurrentStats({ gameId: currentRound.gameId, summary: perGame });

    if (normalized.success) {
      // ✅ lv5, lv6追加
      const difficultyBonus: Record<DifficultyLevel, number> = {
        lv1: 1,
        lv2: 2,
        lv3: 3,
        lv4: 4,
        lv5: 5,
        lv6: 6
      };
      const baseStars = difficultyBonus[currentRound.difficulty] ?? 1;
      const hintBonus = normalized.hintsUsed === 0 ? 1 : 0;
      progressActions.addStars(baseStars + hintBonus);
    }

    const reward = rewardSchedulerRef.current.schedule({
      streak: snapshot.streak,
      rewardTier: recommendation.rewardTier
    });
    setRewardSchedule(reward);

    const scheduleNextRound = () => {
      const nextContext = machineRef.current.nextRound(currentRound.gameId, recommendation.nextDifficulty);
      setCurrentRound(nextContext);
    };

    if (normalized.success) {
      if (nextRoundTimerRef.current) {
        window.clearTimeout(nextRoundTimerRef.current);
      }
      nextRoundTimerRef.current = window.setTimeout(() => {
        scheduleNextRound();
        nextRoundTimerRef.current = undefined;
      }, 900);
    } else {
      scheduleNextRound();
    }
  };

  const endSession = () => {
    const summary = telemetryStoreRef.current.summary();
    setTelemetrySummary(summary);
    setCurrentStats(null);
    setRoundState(null);
    setCurrentModule(null);
    progressActions.endSession(summary);
    machineRef.current.endGame();
  };

  const returnToHub = () => {
    machineRef.current.returnToHub();
    setCurrentStats(null);
  };

  useEffect(() => {
    return () => {
      if (nextRoundTimerRef.current) {
        window.clearTimeout(nextRoundTimerRef.current);
      }
    };
  }, []);

  const resetProgress = () => {
    telemetryStoreRef.current.reset();
    setTelemetrySummary(null);
    setCurrentStats(null);
    setRoundState(null);
    setCurrentModule(null);
    progressActions.resetOnboarding();
    progressActions.resetProgressData();
    machineRef.current.returnToHub();
  };

  const value = useMemo<SessionControllerValue>(() => ({
    stage,
    activeGame,
    currentDifficulty,
    currentRound,
    lastRecommendation,
    rewardSchedule,
    telemetrySummary,
    adaptiveSnapshot,
    currentModule,
    roundState,
    currentStats,
    startGame,
    recordRound,
    endSession,
    returnToHub,
    resetProgress
  }), [
    stage,
    activeGame,
    currentDifficulty,
    currentRound,
    lastRecommendation,
    rewardSchedule,
    telemetrySummary,
    adaptiveSnapshot,
    currentModule,
    roundState,
    currentStats
  ]);

  return <SessionControllerContext.Provider value={value}>{children}</SessionControllerContext.Provider>;
};

export const useSessionController = () => {
  const context = useContext(SessionControllerContext);
  if (!context) {
    throw new Error('useSessionController must be used inside SessionProvider');
  }
  return context;
};
