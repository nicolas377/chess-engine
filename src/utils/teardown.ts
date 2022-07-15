import { exit as ProcessExit } from "node:process";

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

type TeardownCallback = () => void;

const teardownCallbacks: TeardownCallback[] = [];

for (const exitCode of exitCodes) {
  process.on(exitCode, runTeardownCallbacks);
}

export function addTeardownCallback(cb: TeardownCallback): void {
  teardownCallbacks.push(cb);
}

export function runTeardownCallbacks() {
  for (const cb of teardownCallbacks) {
    cb();
  }
  ProcessExit();
}
