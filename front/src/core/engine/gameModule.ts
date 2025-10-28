import { ControlledRandomizer } from '@core/adaptive';
import { DifficultyLevel, GameId } from './types';

export interface GameModuleRound<State = unknown, Hint = unknown> {
  state: State;
  hint?: Hint;
}

export interface GameModule<State = unknown, Input = unknown> {
  id: GameId;
  titleKey: string;
  icon: string;
  baseDifficulty: DifficultyLevel;
  createRound: (params: { difficulty: DifficultyLevel; randomizer: ControlledRandomizer }) => State;
  evaluate: (params: { state: State; input: Input }) => Input;
}

const registry = new Map<GameId, GameModule<any, any>>();

export const registerGameModule = <State, Input>(module: GameModule<State, Input>) => {
  registry.set(module.id, module);
  return module;
};

export const getGameModule = <State = unknown, Input = unknown>(id: GameId): GameModule<State, Input> => {
  const module = registry.get(id);
  if (!module) {
    throw new Error(`Game module '${id}' is not registered.`);
  }
  return module as GameModule<State, Input>;
};

export const listGameModules = () => Array.from(registry.values());

export const clearGameModules = () => registry.clear();
