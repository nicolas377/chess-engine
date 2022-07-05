import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve as ResolvePath } from "node:path";
import { cliArgs } from "../cliWrapper/cliArgs";
import { ExitProcess } from "./helpers";
import { addTeardownCallback } from "./teardown";

// Warning: we rely on the values of the enum being the same as the string values of the enum
export enum DebugLevel {
  FATAL = "FATAL",
  ERROR = "ERROR",
  WARNING = "WARNING",
  INFO = "INFO",
  DEBUG = "DEBUG",
  TRACE = "TRACE",
}

const logs: string[] = [];
let stdoutLevel: DebugLevel = DebugLevel.WARNING;

/**
 * Compares two levels against each other in the manner specified.
 *
 * @param left The level to compare on the left-side of the comparison operator.
 * @param right The level to compare on the right-side of the comparison operator.
 * @param comparisonType The comparison operator to use.
 */
function levelCompare(
  left: DebugLevel,
  right: DebugLevel,
  comparisonType: ">=" | "<=" | "=" | ">" | "<"
): boolean {
  const allLevelsInOrder: DebugLevel[] = [
    DebugLevel.FATAL,
    DebugLevel.ERROR,
    DebugLevel.WARNING,
    DebugLevel.INFO,
    DebugLevel.DEBUG,
    DebugLevel.TRACE,
  ];

  const leftIndex: number = allLevelsInOrder.indexOf(left);
  const rightIndex: number = allLevelsInOrder.indexOf(right);

  switch (comparisonType) {
    case ">=":
      return leftIndex >= rightIndex;
    case "<=":
      return leftIndex <= rightIndex;
    case "=":
      return leftIndex === rightIndex;
    case ">":
      return leftIndex > rightIndex;
    case "<":
      return leftIndex < rightIndex;
  }
}

function logMessage(message: string, level: DebugLevel): void {
  if (levelCompare(stdoutLevel, level, ">=")) {
    console.log(`[${level}]: ${message}`);
  }
  logs.push(`${Date.now()} [${level}]: ${message}`);
}

export function setupTeardown(): void {
  const exitHandler = (): void => {
    const logFile = ResolvePath(
      tmpdir(),
      `engine-${(Date.now() + Math.random() * 0x1000000000).toString(36)}.log`
    );

    if (cliArgs.debug) console.log(`Log file: ${logFile}`);
    writeFileSync(
      logFile,
      logs.reduce<string>((acc, val) => acc + `${val}\n`, "").trimEnd()
    );
  };

  addTeardownCallback(exitHandler);
}

export function setStdoutLevel(level: DebugLevel) {
  stdoutLevel = level;
}

export function logTrace(message: string): void {
  logMessage(message, DebugLevel.TRACE);
}

export function logDebug(message: string): void {
  logMessage(message, DebugLevel.DEBUG);
}

export function logInfo(message: string): void {
  logMessage(message, DebugLevel.INFO);
}

export function logWarning(message: string): void {
  logMessage(message, DebugLevel.WARNING);
}

export function logError(message: string): void {
  logMessage(message, DebugLevel.ERROR);
}

export function logFatal(message: string): never {
  logMessage(message, DebugLevel.FATAL);
  console.log(`Fatal error: check the log file for more information.`);
  ExitProcess(1);
}
