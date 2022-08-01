import { version } from "../package.json";
import { lineReader } from "./cliWrapper/stdinReader";
import { cliArgs, logHelp } from "@utils/cliArgs";
import {
  logInfo,
  setMinLogLevel,
  setupTeardown as setupDebugTeardown,
} from "@utils/Debug";
import { GracefulExitError } from "@utils/errors";

// A gathering place for all teardown functions.
function setupTeardown(): void {
  logInfo("Setting up teardown callbacks");
  setupDebugTeardown();
}

async function main(): Promise<void> {
  // initialize cliArgs before an infinite loop occurs somewhere
  const args = cliArgs();
  setupTeardown();

  if (args.help) {
    logInfo("Help option specified, logging help and exiting");
    logHelp();
    new GracefulExitError().throw();
  }
  if (args.version) {
    logInfo("Version option specified, logging version and exiting");
    console.log(`Engine v${version}`);
    new GracefulExitError().throw();
  }
  logInfo(`Setting log level to ${args.logLevel}`);
  setMinLogLevel(args.logLevel);

  lineReader(() => {});

  // chess engine to use: https://www.npmjs.com/package/js-chess-engine
}

main();
