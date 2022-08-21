export const enum EngineState {
  NONE = 0,
  STARTUP = 1 << 0,
  ERROR = 1 << 1,
}

let currentEngineState: EngineState = EngineState.NONE;

export function getCurrentEngineState(): EngineState {
  return currentEngineState;
}

export function engineIsInState(state: EngineState): boolean {
  return (currentEngineState & state) === state;
}

export function overwriteWithNewEngineState(state: EngineState): EngineState {
  currentEngineState = state;
  return currentEngineState;
}

export function addEngineState(state: EngineState): EngineState {
  currentEngineState |= state;
  return currentEngineState;
}

export function removeEngineState(state: EngineState): EngineState {
  currentEngineState &= ~state;
  return currentEngineState;
}
