import { startEngine } from "cli/wrapper";
import { addEngineState, clearEngineState, EngineState } from "state";
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

function main(): void {
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

main();
