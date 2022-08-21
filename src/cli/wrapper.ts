import { stdin as processStdin, stdout as processStdout } from "node:process";
import { createInterface } from "node:readline";
import { parseUciInputString } from "cli/uci";
import { logInfo } from "utils";

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
  rawLineReader((rawLine) => {
    const uciCommand = parseUciInputString(rawLine);
  });
}
