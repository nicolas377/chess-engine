import { CliArguments } from "./cliWrapper/cliArgs";
import { lineReader } from "./cliWrapper/stdinReader";
import { Debug } from "@utils/Debug";

async function main(): Promise<void> {
  // TODO: fallback error handling

  Debug.setupTeardown();
  // initialize cli flags
  const args = CliArguments.getInstance();
  Debug.setStdoutLevel(args.logLevel);

  lineReader((type, data) => {
    // TODO
  });

  // chess engine to use: https://www.npmjs.com/package/js-chess-engine
}

main();
