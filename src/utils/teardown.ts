import { on as processAddListener, exit as ProcessExitRaw } from "node:process";

type TeardownCallback = () => void;

const exitCodes = [
  // graceful exit
  "beforeExit",
  // Ctrl+C
  "SIGINT",
  // kill commands
  "SIGUSR1",
  "SIGUSR2",
  // uncaught exception and graceful exit errors
  "uncaughtException",
] as const;

const teardownCallbacks: TeardownCallback[] = [];

for (const exitCode of exitCodes) {
  processAddListener(exitCode, runTeardownCallbacks.bind(null, true));
}

export function addTeardownCallback(cb: TeardownCallback): void {
  teardownCallbacks.push(cb);
}

export function runTeardownCallbacks(calledByProcess = false): void {
  for (const cb of teardownCallbacks) {
    cb();
  }
  if (calledByProcess) ProcessExitRaw();
}
