import { startEngine } from "cli/wrapper";
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
  setupTeardown();
  // Argument initialization should be the first thing that happens.
  // Teardown is setup to make sure that teardown callbacks are called even if an error is thrown in argument initialization.
  programOptions.initializeFromCliArgs();

  if (programOptions.printHelpAndExit) {
    logInfo("Help option specified, logging help and exiting");
    logHelp();
    new GracefulExitError().throw();
  }
  if (programOptions.printVersionAndExit) {
    logInfo("Version option specified, logging version and exiting");
    logVersion();
    new GracefulExitError().throw();
  }

  startEngine();
}

main();
