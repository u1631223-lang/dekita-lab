import { AdaptiveRecommendation, GameId, RoundContext, RoundResult, SessionEvent, SessionEventListener, SessionStage } from './types';

type ListenerMap = Map<SessionEventListener, SessionEventListener>;

type SessionMachineOptions = {
  onRecommendation: (context: RoundContext, result: RoundResult) => AdaptiveRecommendation;
};

export class SessionMachine {
  private stage: SessionStage = 'hub';
  private listeners: ListenerMap = new Map();
  private readonly onRecommendation: SessionMachineOptions['onRecommendation'];

  constructor(options: SessionMachineOptions) {
    this.onRecommendation = options.onRecommendation;
  }

  get currentStage() {
    return this.stage;
  }

  subscribe(listener: SessionEventListener) {
    this.listeners.set(listener, listener);
    return () => this.listeners.delete(listener);
  }

  startGame(gameId: GameId, difficulty: RoundContext['difficulty']) {
    this.updateStage('game');
    return this.nextRound(gameId, difficulty);
  }

  nextRound(gameId: GameId, difficulty: RoundContext['difficulty']) {
    const context = this.createRoundContext(gameId, difficulty);
    this.emit({ type: 'round-started', context });
    return context;
  }

  finishRound(context: RoundContext, result: RoundResult) {
    const recommendation = this.onRecommendation(context, result);
    this.emit({ type: 'round-finished', context, result, recommendation });
    return recommendation;
  }

  endGame() {
    this.updateStage('summary');
  }

  returnToHub() {
    this.updateStage('hub');
  }

  private emit(event: SessionEvent) {
    this.listeners.forEach((listener) => listener(event));
  }

  private updateStage(stage: SessionStage) {
    this.stage = stage;
    this.emit({ type: 'stage-changed', stage });
  }

  private createRoundContext(gameId: GameId, difficulty: RoundContext['difficulty']): RoundContext {
    return {
      gameId,
      difficulty,
      roundId: crypto.randomUUID(),
      startedAt: performance.now()
    };
  }
}
