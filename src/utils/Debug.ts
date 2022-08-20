import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve as ResolvePath } from "node:path";
import { DebugLevel, logLevelNames } from "types";
import {
  addTeardownCallback,
  cliArgs,
  cliArgsHadError,
  exitProcess,
} from "utils";

// Warning! Do not rely on cliArgs anywhere in this file.
// It can, and probably will cause an infinite loop, and the process will hang.

type JSONable =
  | null
  | undefined
  | string
  | number
  | Date
  | unknown[]
  | readonly unknown[]
  | { [key: string]: JSONable };

interface Log {
  date: string;
  level: DebugLevel;
  message: string;
}

const logs: Log[] = [];

function compareLogLevel(
  LHS: DebugLevel,
  RHS: DebugLevel,
  operator: ">" | "<" | ">=" | "<=" | "="
): boolean {
  // We can't object destructure the array for the indexOf() method,
  // as it messes with this bindings needed to make indexOf() work.

  // The array element order needs to be from least to most important
  // in order for indexing to work as intended.
  const debugLevels = [
    DebugLevel.TRACE,
    DebugLevel.INFO,
    DebugLevel.OUTPUT,
    DebugLevel.WARNING,
    DebugLevel.FATAL,
  ] as const;

  // We also ensure that debugLevels contains all the levels, and nothing else in the indexOf() calls.
  const LHSIndex = debugLevels.indexOf(LHS);
  const RHSIndex = debugLevels.indexOf(RHS);

  switch (operator) {
    case ">":
      return LHSIndex > RHSIndex;
    case "<":
      return LHSIndex < RHSIndex;
    case ">=":
      return LHSIndex >= RHSIndex;
    case "<=":
      return LHSIndex <= RHSIndex;
    case "=":
      return LHSIndex === RHSIndex;
  }
}

export function stringifyMessage(messageComponents: JSONable[]): string {
  return messageComponents
    .reduce<string[]>((acc, component) => {
      const stringifiedComponent: string =
        typeof component === "string"
          ? component
          : typeof component === "number"
          ? component.toString()
          : component instanceof Date
          ? component.toISOString()
          : JSON.stringify(component, (key, value) =>
              value instanceof Date ? value.toISOString() : value
            );

      return acc.concat(stringifiedComponent);
    }, [])
    .join(" ");
}

function logMessage(level: DebugLevel, messageComponents: JSONable[]): void {
  logs.push({
    date: new Date(Date.now()).toISOString(),
    level,
    message: stringifyMessage(messageComponents),
  });
}

export function setupDebugTeardown(): void {
  addTeardownCallback(() => {
    // The only reason cliArgs is used here is to get the log level.
    // The only way that the teardown callback is called before cliArgs is fully initialized
    // is if cliArgs initialization throws, in which case, cliArgsHadError will be set to true,
    // and we will fall back to trace logging.
    const logLevel: DebugLevel = cliArgsHadError
      ? DebugLevel.TRACE
      : cliArgs().logLevel;
    const logFile = ResolvePath(
      tmpdir(),
      `engine-${(Date.now() + Math.random() * 0x1000000000).toString(36)}.log`
    );

    console.log(`Log file: ${logFile}`);
    writeFileSync(
      logFile,
      logs.reduce<string>((acc, { message, date, level }) => {
        if (compareLogLevel(level, logLevel, ">=")) {
          return acc + `[${date}] (${logLevelNames[level]}): ${message}\n`;
        } else return acc;
      }, "")
    );
  });
}

export function outputToConsole(...messageComponents: JSONable[]): void {
  console.log(stringifyMessage(messageComponents));
  logMessage(DebugLevel.OUTPUT, messageComponents);
}

export function logTrace(...messageComponents: JSONable[]): void {
  logMessage(DebugLevel.TRACE, messageComponents);
}

export function logInfo(...messageComponents: JSONable[]): void {
  logMessage(DebugLevel.INFO, messageComponents);
}

export function logWarning(
  { log = false }: { log?: boolean } = {},
  ...messageComponents: JSONable[]
): void {
  if (log) console.log(stringifyMessage(messageComponents));
  logMessage(DebugLevel.WARNING, messageComponents);
}

export function logError(message: string): never {
  logMessage(DebugLevel.FATAL, [message]);
  console.log(`Fatal error: check the log file for more information.`);
  exitProcess(1);
}

export function wrapWithQuotes(str: string): string {
  return `"${str}"`;
}
