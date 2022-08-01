import { lineReader } from "./cliWrapper/stdinReader";
import {
  cliArgs,
  GracefulExitError,
  logHelp,
  logInfo,
  logVersion,
  setMinLogLevel,
  setupTeardown as setupDebugTeardown,
} from "utils";

function setupTeardown(): void {
  logInfo("Setting up teardown callbacks");
  setupDebugTeardown();
}

async function main(): Promise<void> {
  // Argument initialization and caching has to be the first thing that happens.
  // Otherwise, we cannot guarantee that an infinite loop will not occur.
  const args = cliArgs();
  setupTeardown();

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
  logInfo(`Setting log level to "${args.logLevel}"`);
  setMinLogLevel(args.logLevel);

  lineReader(() => {});

  // chess engine to use: https://www.npmjs.com/package/js-chess-engine
}

main();
