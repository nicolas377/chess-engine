import { version } from "../package.json";
import { cliArgs, errorMakingArgs, logHelp } from "./cliWrapper/cliArgs";
import { lineReader } from "./cliWrapper/stdinReader";
import { setupTeardown as setupDebugTeardown } from "@utils/Debug";
import { GracefulExitError } from "@utils/errors";

// A gathering place for all teardown functions.
function setupTeardown(): void {
  setupDebugTeardown();
}

async function main(): Promise<void> {
  setupTeardown();

  errorMakingArgs?.throw();

  if (cliArgs().help) {
    logHelp();
    new GracefulExitError().throw();
  }
  if (cliArgs().version) {
    console.log(`Engine v${version}`);
    new GracefulExitError().throw();
  }

  lineReader(() => {});

  // chess engine to use: https://www.npmjs.com/package/js-chess-engine
}

main();
