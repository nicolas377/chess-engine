import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve as ResolvePath } from "node:path";
import { ExitProcess } from "@utils/helpers";
import { addTeardownCallback } from "@utils/teardown";

// Warning! Do not rely on cliArgs anywhere in this file where it could possibly not have been created yet.
// It will cause circular calls and crash!

// Warning: the values of the enum must be the same as the string values of the enum
export enum DebugLevel {
  FATAL = "FATAL",
  ERROR = "ERROR",
  WARNING = "WARNING",
  OUTPUT = "OUTPUT",
  INFO = "INFO",
  DEBUG = "DEBUG",
  TRACE = "TRACE",
}

interface Log {
  date: string;
  level: DebugLevel;
  message: string;
}
const logs: Log[] = [];
let minLogLevel: DebugLevel = DebugLevel.TRACE;

export function setMinLogLevel(level: DebugLevel): void {
  minLogLevel = level;
}

function compareLogLevel(
  LHS: DebugLevel,
  RHS: DebugLevel,
  operator: ">" | "<" | ">=" | "<=" | "="
): boolean {
  // this needs to be flipped, like it currently is, for indexing to work as intended
  const { indexOf: indexOfLevel }: DebugLevel[] = [
    DebugLevel.TRACE,
    DebugLevel.DEBUG,
    DebugLevel.INFO,
    DebugLevel.OUTPUT,
    DebugLevel.WARNING,
    DebugLevel.ERROR,
    DebugLevel.FATAL,
  ];

  const LHSIndex = indexOfLevel(LHS);
  const RHSIndex = indexOfLevel(RHS);

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

function logMessage(level: DebugLevel, message: string): void {
  console.log(`(${level}): ${message}`);
  if (compareLogLevel(level, minLogLevel, ">="))
    logs.push({
      date: new Date(Date.now()).toISOString(),
      level,
      message,
    });
}

export function setupTeardown(): void {
  addTeardownCallback(() => {
    const logFile = ResolvePath(
      tmpdir(),
      `engine-${(Date.now() + Math.random() * 0x1000000000).toString(36)}.log`
    );

    console.log(`Log file: ${logFile}`);
    writeFileSync(
      logFile,
      logs.reduce<string>(
        (acc, { message, date, level }) =>
          compareLogLevel(level, minLogLevel, ">=")
            ? acc + `[${date}] (${level}): ${message}\n`
            : acc,
        ""
      )
    );
  });
}

export function outputToConsole(message: string): void {
  console.log(message);
  logMessage(DebugLevel.OUTPUT, message);
}

export const logTrace = logMessage.bind(null, DebugLevel.TRACE);

export const logInfo = logMessage.bind(null, DebugLevel.INFO);

export function logWarning(message: string, log = false): void {
  if (log) console.log(message);
  logMessage(DebugLevel.WARNING, message);
}

export function logError(message: string): never {
  logMessage(DebugLevel.FATAL, message);
  console.log(`Fatal error: check the log file for more information.`);
  ExitProcess(1);
}

type JSONable =
  | string
  | number
  | Date
  | unknown[]
  | readonly unknown[]
  | { [key: string]: JSONable };

// helpers to log data types
export function stringifyJsonData(data: JSONable): string {
  return JSON.stringify(data, (_key, value) =>
    value instanceof Date ? value.toISOString() : value
  );
}
