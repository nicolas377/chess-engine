import { version } from "../package.json";
import { cliArgs, logHelp } from "./cliWrapper/cliArgs";
import { lineReader } from "./cliWrapper/stdinReader";
import { setupTeardown as setupDebugTeardown } from "@utils/Debug";
import { ExitProcess } from "@utils/helpers";

// A gathering place for all teardown functions.
function setupTeardown(): void {
  setupDebugTeardown();
}

async function main(): Promise<void> {
  setupTeardown();

  if (cliArgs.help) {
    logHelp();
    ExitProcess(0);
  }
  if (cliArgs.version) {
    console.log(`Engine v${version}`);
    ExitProcess(0);
  }

  lineReader((type, data) => {
    // TODO
  });

  // chess engine to use: https://www.npmjs.com/package/js-chess-engine
}

main();
