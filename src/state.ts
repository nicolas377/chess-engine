// due to the limitations of JS bitwise operations, we can have a maximum of 30 bitshifted states
export const enum EngineState {
  NONE = 0,
  STARTUP = 1 << 0,
  ERROR = 1 << 1,
  EXITING = 1 << 2,
  READY = 1 << 3,
  RECEIVED_UCI = 1 << 4,
  THINKING = 1 << 5,
}

let currentEngineState: EngineState = EngineState.NONE;

export function clearEngineState(): void {
  currentEngineState = EngineState.NONE;
}

export function engineIsInState(state: EngineState): boolean {
  // Say the engine is in STARTUP, ERROR, and EXITING, and we are checking for ERROR.
  // In binary, currentEngineState is 111 (7), and ERROR is 010 (2).
  // Bitwise AND will return the common bits, which is 010 (2).
  // So, the engine is in ERROR.

  // Say the engine is in STARTUP, and we are checking for READY.
  // In binary, currentEngineState is 0001 (1), and READY is 1000 (8).
  // Bitwise AND will return the common bits, which is 0000 (0).
  // So, the engine is not in READY.

  // Since all the flags are bitshifted 1, bitwise AND will always return 0 if the engine is not in a certain state.
  return (currentEngineState & state) !== 0;
}

export function addEngineState(state: EngineState): EngineState {
  // Say the engine is in READY and ERROR, and we are adding EXITING.
  // In binary, currentEngineState is 1010 (10), and EXITING is 0100 (4).
  // Bitwise OR will return the combined bits, which is 1110 (14).
  // The result of the bitwise OR is the new currentEngineState.

  // Say the engine is in READY and THINKING, and we are adding THINKING.
  // In binary, currentEngineState is 101000 (40), and THINKING is 100000 (2).
  // Bitwise OR will return the combined bits, which is 101000 (40).

  currentEngineState |= state;
  return currentEngineState;
}

export function removeEngineState(state: EngineState): EngineState {
  // Say the engine is in READY and ERROR, and we are removing ERROR.
  // In binary, currentEngineState is 1010 (10), and ERROR is 0010 (2).
  // We want to remove the ERROR bit, so we do a bitwise NOT to turn 0010 into 1101.
  // Bitwise AND will return the common bits between 1010 and 1101, which is 1000 (8).
  // The result of the bitwise AND is the new currentEngineState.

  // Say the engine is in READY and THINKING, and we are removing RECEIVED_UCI.
  // In binary, currentEngineState is 101000 (40), and RECEIVED_UCI is 010000 (16).
  // We want to remove the RECEIVED_UCI bit, so we do a bitwise NOT to turn 010000 into 101111.
  // Bitwise AND will return the common bits between 101000 and 101111, which is 101000 (40).

  currentEngineState &= ~state;
  return currentEngineState;
}
