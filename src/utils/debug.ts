import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve as ResolvePath } from "node:path";
import { DebugLevel, logLevelNames, Options } from "types";
import { addTeardownCallback, programOptions } from "utils";

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

function logMessage(level: DebugLevel, messageComponents: JSONable[]): void {
  logs.push({
    date: Date.now(),
    level,
    message: stringifyMessage(messageComponents),
  });
}

export function setupDebugTeardown(): void {
  addTeardownCallback(() => {
    if (!programOptions.getOption(Options.DEBUG)) return;

    const logFile = ResolvePath(
      tmpdir(),
      `engine-${(Date.now() + Math.random() * 0x1000000000).toString(36)}.log`
    );

    console.log(`Log file: ${logFile}`);
    writeFileSync(
      logFile,
      logs.reduce<string>(
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

export function logWarning(
  { log = false }: { log?: boolean } = {},
  ...messageComponents: JSONable[]
): void {
  if (log) console.log(stringifyMessage(messageComponents));
  logMessage(DebugLevel.WARNING, messageComponents);
}

export function logError(message: string): void {
  logMessage(DebugLevel.FATAL, [message]);
}

export function wrapWithQuotes(str: string): string {
  return `"${str}"`;
}
