import { on as processAddListener, exit as ProcessExitRaw } from "node:process";
import { logTrace } from "utils";

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
  processAddListener(exitCode, runTeardownCallbacks.bind(undefined, true));
}

export function addTeardownCallback(cb: TeardownCallback): void {
  teardownCallbacks.push(cb);
}

export function runTeardownCallbacks(): void;
export function runTeardownCallbacks(calledByProcess: false): void;
export function runTeardownCallbacks(calledByProcess: true): never;
export function runTeardownCallbacks(calledByProcess?: boolean): void {
  logTrace("Running teardown functions");

  for (const cb of teardownCallbacks) {
    cb();
  }
  if (calledByProcess) {
    logTrace("Exiting process");
    ProcessExitRaw();
  }
}
