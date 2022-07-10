import { file } from "tmp-promise";
import { CliArguments } from "./cliWrapper/cliArgs";
import { lineReader } from "./cliWrapper/stdinReader";
import { UciCommandType } from "./cliWrapper/uci";
import { Debug } from "@utils/Debug";

async function main(): Promise<void> {
  // TODO: logging to a file
  // TODO: custom errors and warnings
  // TODO: fallback error handling

  // initialize cli flags
  CliArguments.getInstance();

  const { path: logFile }: { path: string } = await file({
    prefix: "engine-log",
    keep: true,
  });
  Debug.setLogFile(logFile);

  lineReader((type, data) => {
    switch (type) {
      case UciCommandType.UNKNOWN:
        break;
    }
  });

  // chess engine to use: https://www.npmjs.com/package/js-chess-engine
}

main();
