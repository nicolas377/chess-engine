import { isMainThread, workerData } from "node:worker_threads";
import { startEngine } from "cli/wrapper";
import { addEngineState, clearEngineState, EngineState } from "state";
import { Options } from "types";
import {
  GracefulExitError,
  logHelp,
  logInfo,
  logVersion,
  programOptions,
  setupDebugTeardown,
} from "utils";

function setupTeardown(): void {
  logInfo("Setting up teardown callbacks");
  setupDebugTeardown();
}

function mainThreadWorker(): void {
  clearEngineState();
  addEngineState(EngineState.STARTUP);
  setupTeardown();
  programOptions.initializeFromCliArgs();

  if (programOptions.getOption(Options.HELP)) {
    logInfo("Help option specified, logging help and exiting");
    logHelp();
    new GracefulExitError().throw();
  }
  if (programOptions.getOption(Options.VERSION)) {
    logInfo("Version option specified, logging version and exiting");
    logVersion();
    new GracefulExitError().throw();
  }

  startEngine();
}

function calculatingThreadWorker(): void {
  programOptions.takeActionFromOptionString(workerData!.serializedOptions);
}

function main(): void {
  if (isMainThread) mainThreadWorker();
  else calculatingThreadWorker();
}

main();
