import { lineReader } from "./cliWrapper/stdinReader";
import {
  cliArgs,
  GracefulExitError,
  logHelp,
  logInfo,
  logVersion,
  setMinLogLevel,
  setupTeardown as setupDebugTeardown,
  wrapWithQuotes,
} from "utils";

function setupTeardown(): void {
  logInfo("Setting up teardown callbacks");
  setupDebugTeardown();
}

async function main(): Promise<void> {
  setupTeardown();
  // Argument initialization and caching has to be the first thing that happens.
  // Teardown setup is the only exception because it could be called if cliArgs throws.
  // Otherwise, we cannot guarantee that an infinite loop will not occur.
  const args = cliArgs();

  logInfo("Setting log level to", wrapWithQuotes(args.logLevel));
  setMinLogLevel(args.logLevel);
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

  lineReader(() => {});
}

main();
