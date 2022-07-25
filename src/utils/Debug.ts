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
  OUTPUT = "OUTPUT",
  INFO = "INFO",
  DEBUG = "DEBUG",
  TRACE = "TRACE",
}

const logs: string[] = [];

function logMessage(message: string, level: DebugLevel): void {
  const outputMessage = `[${new Date(
    Date.now()
  ).toISOString()}] (${level}): ${message}`;

  if (cliArgs().debug && level !== DebugLevel.OUTPUT)
    console.log(outputMessage);
  logs.push(outputMessage);
}

export function setupTeardown(): void {
  const exitHandler = (): void => {
    const logFile = ResolvePath(
      tmpdir(),
      `engine-${(Date.now() + Math.random() * 0x1000000000).toString(36)}.log`
    );

    console.log(`Log file: ${logFile}`);
    writeFileSync(logFile, logs.join("\n"));
  };

  addTeardownCallback(exitHandler);
}

/** Logs to the console and logs as output. */
export function outputToConsole(message: string): void {
  console.log(message);
  logMessage(message, DebugLevel.OUTPUT);
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

/** Something unexpected happened that may disturb a process, but the engine has not failed. */
export function logWarning(message: string, log = false): void {
  if (log) console.log(message);
  logMessage(message, DebugLevel.WARNING);
}

/** When the engine is no longer able to function properly. Generally used by error classes. */
export function logError(message: string): never {
  logMessage(message, DebugLevel.FATAL);
  console.log(`Fatal error: check the log file for more information.`);
  ExitProcess(1);
}
