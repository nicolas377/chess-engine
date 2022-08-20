import { startEngine } from "cliWrapper/wrapper";
import {
  cliArgs,
  GracefulExitError,
  logHelp,
  logInfo,
  logVersion,
  setupDebugTeardown,
} from "utils";

function setupTeardown(): void {
  logInfo("Setting up teardown callbacks");
  setupDebugTeardown();
}

async function main(): Promise<void> {
  setupTeardown();
  // Argument initialization and caching has to be the first thing that happens.
  // Teardown setup is the only exception because it could be called if cliArgs throws.
  // Otherwise, it's entirely possible that an infinite loop will occur and the process will hang.
  const args = cliArgs();

  if (args.help) {
    logInfo("Help option specified, logging help and exiting");
    logHelp();
    new GracefulExitError().throw();
  }
  if (args.version) {
    logInfo("Version option specified, logging version and exiting");
    logVersion();
    new GracefulExitError().throw();
  }

  startEngine();
}

main();
