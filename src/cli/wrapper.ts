import { stdin as processStdin, stdout as processStdout } from "node:process";
import { createInterface } from "node:readline";
import { handleUciInput } from "cli/handler";
import { parseUciInputString } from "cli/uci";
import { addEngineState, EngineState, removeEngineState } from "state";
import { UciCommandType } from "types";
import { logInfo, logWarning, outputToConsole, wrapWithQuotes } from "utils";

// TODO: accept input in stdin even while stdout is being written to
function rawLineReader(cb: (rawLine: string) => void): void {
  processStdin.resume();

  const rl = createInterface({
    input: processStdin,
    output: processStdout,
    terminal: false,
  });

  rl.on("line", (line: string) => {
    cb(line);
  });
}

export function startEngine(): void {
  logInfo("Starting the engine");
  removeEngineState(EngineState.STARTUP);
  addEngineState(EngineState.READY);
  rawLineReader((rawLine) => {
    logInfo("Received raw line:", wrapWithQuotes(rawLine));
    addEngineState(EngineState.RECEIVED_UCI);

    const uciCommandOrError = parseUciInputString(rawLine);

    if (uciCommandOrError instanceof Error) {
      logInfo(
        "An error occurred while parsing the UCI command. It will be logged, and the command will be ignored."
      );
      logWarning(undefined, uciCommandOrError.toString());
      return;
    }
    if (uciCommandOrError.type === UciCommandType.UNKNOWN) {
      outputToConsole("Unknown command:", rawLine);
      logInfo("Unknown UCI command:", wrapWithQuotes(rawLine));
      return;
    }

    handleUciInput(uciCommandOrError);

    removeEngineState(EngineState.RECEIVED_UCI);
  });
}
