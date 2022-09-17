import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve as resolvePath } from "node:path";
import { isMainThread } from "node:worker_threads";
import { DebugLevel, logLevelNames, Options } from "types";
import { addTeardownCallback, programOptions } from "utils";
import { createDebugLogMessage, sendMessage } from "workerController";

type JSONable =
  | undefined
  | string
  | number
  | boolean
  | Date
  | readonly JSONable[]
  | { [key: string]: JSONable };

interface Log {
  date: number;
  level: DebugLevel;
  message: string;
}

const logs: Log[] = [];

const { push: pushLog } = logs;

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
          : JSON.stringify(component, (_key, value) =>
              value instanceof Date ? value.toISOString() : value
            );

      return acc.concat(stringifiedComponent);
    }, [])
    .join(" ");
}

declare const productionBuild: boolean;

function logMessage(level: DebugLevel, messageComponents: JSONable[]): void {
  if (productionBuild === false) {
    const debugLog: Log = {
      date: Date.now(),
      level,
      message: stringifyMessage(messageComponents),
    };

    if (isMainThread) pushLog(debugLog);
    else sendMessage(createDebugLogMessage(debugLog));
  }
}

export function setupDebugTeardown(): void {
  addTeardownCallback(() => {
    if (!programOptions.getOption(Options.DEBUG)) return;

    const logFile = resolvePath(
      tmpdir(),
      `engine-${(Date.now() + Math.random() * 0x1000000000).toString(36)}.log`
    );

    console.log(`Log file: ${logFile}`);
    writeFileSync(
      logFile,
      logs
        .sort(({ date: date1 }, { date: date2 }) => date1 - date2)
        .reduce<string>(
          (acc, { message, date, level }) =>
            // prettier-ignore
            acc + `[${new Date(date).toISOString()}] (${logLevelNames[level]}): ${message}\n`,
          ""
        )
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

export function logWarningToConsole(...messageComponents: JSONable[]) {
  console.log(stringifyMessage(messageComponents));
  logMessage(DebugLevel.WARNING, messageComponents);
}

export function logWarning(...messageComponents: JSONable[]): void {
  logMessage(DebugLevel.WARNING, messageComponents);
}

export function logError(message: string): void {
  logMessage(DebugLevel.FATAL, [message]);
}

export function wrapWithQuotes(str: string): string {
  return `"${str}"`;
}

export { Log as DebugLog, pushLog };
