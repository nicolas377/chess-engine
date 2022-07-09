import { file } from "tmp-promise";
import { lineReader } from "./cliWrapper/cliReader";
import { UciCommandType } from "./cliWrapper/uci";
import { Debug } from "@utils/Debug";

async function main(): Promise<void> {
  // TODO: cli flags (and globally available representations of them)
  // TODO: logging to a file
  // TODO: custom errors and warnings
  // TODO: fallback error handling
  const { path: logFile }: { path: string } = await file();
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
