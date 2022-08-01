import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve as ResolvePath } from "node:path";
import { DebugLevel } from "../types";
import { ExitProcess } from "@utils/helpers";
import { addTeardownCallback } from "@utils/teardown";

// Warning! Do not rely on cliArgs anywhere in this file where it could possibly not have been created yet.
// It will cause circular calls and crash!

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
  // We can't object destructure the array for the indexOf() method,
  // as it messes with this bindings needed to make indexOf() work.

  // The array element order needs to be from least to most important
  // in order for indexing to work as intended.
  const debugLevels: DebugLevel[] = [
    DebugLevel.TRACE,
    DebugLevel.DEBUG,
    DebugLevel.INFO,
    DebugLevel.OUTPUT,
    DebugLevel.WARNING,
    DebugLevel.ERROR,
    DebugLevel.FATAL,
  ];

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

function logMessage(level: DebugLevel, message: string): void {
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
