import { writeFileSync } from "node:fs";
import { resolve as ResolvePath } from "node:path";
import { exit as ProcessExit } from "node:process";
import { file } from "tmp-promise";
import { addTeardownCallback, runTeardownCallbacks } from "./teardown";

// the code relies on string enum values that match the all caps titles
export enum DebugLevel {
  FATAL = "FATAL",
  ERROR = "ERROR",
  WARNING = "WARNING",
  INFO = "INFO",
  DEBUG = "DEBUG",
  TRACE = "TRACE",
}

async function getLogFilePath(): Promise<string> {
  const { path: logFile }: { path: string } = await file({
    prefix: "engine-log",
    keep: true,
  });

  return ResolvePath(logFile);
}

export class Debug {
  private static _logFile: string | undefined;
  private static _logs: string[] = [];
  private static _stdoutLevel: DebugLevel = DebugLevel.WARNING;

  public static setStdoutLevel(level: DebugLevel) {
    Debug._stdoutLevel = level;
  }

  public static setupTeardown(): void {
    const exitHandler = (): void => {
      if (Debug._logFile) writeFileSync(Debug._logFile, Debug._logs.join("\n"));
    };

    addTeardownCallback(exitHandler);
  }

  private static async logHandler(
    message: string,
    level: DebugLevel
  ): Promise<void> {
    Debug._logFile ??= await getLogFilePath();

    if (Debug.levelCompare(Debug._stdoutLevel, level, "<=")) {
      console.log(`[${level}]: ${message}`);
    }
    Debug._logs.push(`${Date.now()} [${level}]: ${message}\n`);
  }

  /**
   * Compares two levels against each other in the manner specified.
   *
   * @param left The level to compare on the left-side of the comparison operator.
   * @param right The level to compare on the right-side of the comparison operator.
   * @param comparisonType The comparison operator to use.
   */
  private static levelCompare(
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

  public static trace(message: string): void {
    Debug.logHandler(message, DebugLevel.TRACE);
  }

  public static debug(message: string): void {
    Debug.logHandler(message, DebugLevel.DEBUG);
  }

  public static info(message: string): void {
    Debug.logHandler(message, DebugLevel.INFO);
  }

  public static warning(message: string): void {
    Debug.logHandler(message, DebugLevel.WARNING);
  }

  public static error(message: string): void {
    Debug.logHandler(message, DebugLevel.ERROR);
  }

  public static async fatal(message: string): Promise<never> {
    await Debug.logHandler(message, DebugLevel.FATAL);
    console.log(`Fatal error: check the log file for more information.`);
    console.log(`Log file: ${Debug._logFile}`);
    runTeardownCallbacks();
    ProcessExit(1);
  }
}
